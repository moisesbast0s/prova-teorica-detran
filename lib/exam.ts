import { Topic } from '@prisma/client'
import { prisma } from './prisma'
import { ExamResult } from '@/types'

export const EXAM_RULES = {
  totalQuestions: 30,
  timeMinutes: 45,
  passingScore: 21, // mínimo para aprovação (70%)
  eliminatoryTopics: [Topic.PRIMEIROS_SOCORROS, Topic.MEIO_AMBIENTE] as Topic[],
}

/**
 * Sorteia `count` questões do banco respeitando filtros de tema.
 * Se múltiplos temas forem fornecidos, distribui proporcionalmente.
 */
export async function generateExam(topics: Topic[], count: number = 30) {
  if (topics.length === 0) {
    topics = Object.values(Topic)
  }

  const perTopic = Math.floor(count / topics.length)
  const remainder = count % topics.length

  const questionIds: string[] = []

  for (let i = 0; i < topics.length; i++) {
    const limit = i === topics.length - 1 ? perTopic + remainder : perTopic
    const questions = await prisma.question.findMany({
      where: { topic: topics[i] },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    })

    // Shuffle and take `limit`
    const shuffled = questions.sort(() => Math.random() - 0.5)
    questionIds.push(...shuffled.slice(0, limit).map((q: { id: string }) => q.id))
  }

  // Se não há questões suficientes por tema, complementar aleatoriamente
  if (questionIds.length < count) {
    const existing = new Set(questionIds)
    const extra = await prisma.question.findMany({
      where: {
        topic: { in: topics },
        id: { notIn: questionIds },
      },
      select: { id: true },
    })
    const shuffled = extra.sort(() => Math.random() - 0.5)
    for (const q of shuffled) {
      if (questionIds.length >= count) break
      if (!existing.has(q.id)) {
        questionIds.push(q.id)
        existing.add(q.id)
      }
    }
  }

  return questionIds.slice(0, count)
}

/**
 * Calcula o resultado final de um simulado com base nas tentativas.
 */
export function calculateResult(
  attempts: {
    questionId: string
    optionId: string | null
    isCorrect: boolean | null
    question: { topic: Topic }
  }[]
): ExamResult {
  const byTopic: Record<string, { correct: number; total: number; topic: Topic }> = {}

  for (const attempt of attempts) {
    const topicKey = attempt.question.topic
    if (!byTopic[topicKey]) {
      byTopic[topicKey] = { correct: 0, total: 0, topic: topicKey }
    }
    byTopic[topicKey].total++
    if (attempt.isCorrect) {
      byTopic[topicKey].correct++
    }
  }

  const score = attempts.filter((a) => a.isCorrect).length
  const passed = score >= EXAM_RULES.passingScore

  // Verificar se falhou em tema eliminatório (0 acertos no tema)
  const eliminatoryFailedTopics: Topic[] = []
  for (const topic of EXAM_RULES.eliminatoryTopics) {
    const stats = byTopic[topic]
    if (stats && stats.total > 0 && stats.correct === 0) {
      eliminatoryFailedTopics.push(topic)
    }
  }

  const eliminatoryFailed = eliminatoryFailedTopics.length > 0

  return {
    score,
    passed: passed && !eliminatoryFailed,
    eliminatoryFailed,
    eliminatoryFailedTopics,
    byTopic,
  }
}
