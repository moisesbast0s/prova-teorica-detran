import { Topic } from '@prisma/client'
import { prisma } from './prisma'
import { ExamResult } from '@/types'
import {
  OFFICIAL_EXAM_PASSING_SCORE,
  OFFICIAL_EXAM_TIME_MINUTES,
  OFFICIAL_EXAM_TOTAL_QUESTIONS,
  getPassingScore,
  isOfficialExam,
} from '@/lib/exam-rules'

export const EXAM_RULES = {
  totalQuestions: OFFICIAL_EXAM_TOTAL_QUESTIONS,
  timeMinutes: OFFICIAL_EXAM_TIME_MINUTES,
  passingScore: OFFICIAL_EXAM_PASSING_SCORE,
  eliminatoryTopics: [Topic.PRIMEIROS_SOCORROS, Topic.MEIO_AMBIENTE] as Topic[],
}

/** Pesos base por situação da questão para o usuário */
const WEIGHT_UNSEEN = 100 // nunca respondida
const WEIGHT_WRONG_BASE = 80 // errada recentemente
const WEIGHT_CORRECT_MIN = 5 // acertada muitas vezes seguidas (mínimo)
const WEIGHT_CORRECT_BASE = 95 // ponto de partida para questões acertadas

/**
 * Calcula o peso de prioridade de uma questão com base no histórico do usuário.
 *
 * Lógica de repetição espaçada:
 * - Nunca vista → peso máximo (WEIGHT_UNSEEN)
 * - Última resposta errada → peso alto, decai com o tempo
 * - Última resposta correta → peso baixo, penalizado pela sequência de acertos e recência
 */
function calculateWeight(
  attempts: { isCorrect: boolean | null; answeredAt: Date }[]
): number {
  if (attempts.length === 0) return WEIGHT_UNSEEN

  // Ordenar do mais recente para o mais antigo
  const sorted = [...attempts].sort(
    (a, b) => b.answeredAt.getTime() - a.answeredAt.getTime()
  )

  const lastAttempt = sorted[0]
  const daysSinceLast =
    (Date.now() - lastAttempt.answeredAt.getTime()) / (1000 * 60 * 60 * 24)

  if (!lastAttempt.isCorrect) {
    // Questão errada recentemente: peso alto, que sobe se faz tempo que foi errada
    // (o usuário pode precisar revisitar, mas não imediatamente)
    const recencyBoost = Math.min(20, daysSinceLast * 2)
    return Math.min(100, WEIGHT_WRONG_BASE + recencyBoost)
  }

  // Contar quantas respostas corretas consecutivas (mais recentes primeiro)
  let correctStreak = 0
  for (const attempt of sorted) {
    if (attempt.isCorrect) correctStreak++
    else break
  }

  // Penalidade pela sequência de acertos
  const streakPenalty = correctStreak * 20
  // Penalidade pela recência: quanto mais recente o acerto, menor o peso
  const recencyPenalty = Math.max(0, 30 - daysSinceLast * 3)

  const weight = Math.max(
    WEIGHT_CORRECT_MIN,
    WEIGHT_CORRECT_BASE - streakPenalty - recencyPenalty
  )

  return weight
}

/**
 * Seleciona `count` IDs de questões usando amostragem ponderada (sem repetição).
 * Questões com peso maior têm mais chance de serem selecionadas.
 */
function weightedSampleWithoutReplacement(
  pool: { id: string; weight: number }[],
  count: number
): string[] {
  const remaining = [...pool]
  const selected: string[] = []

  while (selected.length < count && remaining.length > 0) {
    const totalWeight = remaining.reduce((sum, q) => sum + q.weight, 0)
    let rand = Math.random() * totalWeight
    let chosenIndex = remaining.length - 1

    for (let i = 0; i < remaining.length; i++) {
      rand -= remaining[i].weight
      if (rand <= 0) {
        chosenIndex = i
        break
      }
    }

    selected.push(remaining[chosenIndex].id)
    remaining.splice(chosenIndex, 1)
  }

  return selected
}

/**
 * Sorteia `count` questões do banco respeitando filtros de tema.
 * Usa repetição espaçada: questões nunca vistas ou erradas recentemente
 * têm maior probabilidade de aparecer do que questões já dominadas.
 */
export async function generateExam(
  topics: Topic[],
  count: number = 30,
  userId?: string
) {
  if (topics.length === 0) {
    topics = Object.values(Topic)
  }

  // Buscar todas as questões dos temas selecionados
  const allQuestions = await prisma.question.findMany({
    where: { topic: { in: topics } },
    select: { id: true, topic: true },
  })

  // Se há userId, buscar histórico de tentativas do usuário
  let attemptsByQuestion: Map<string, { isCorrect: boolean | null; answeredAt: Date }[]> =
    new Map()

  if (userId) {
    const userAttempts = await prisma.attempt.findMany({
      where: {
        question: { topic: { in: topics } },
        exam: { userId },
        isCorrect: { not: null },
      },
      select: {
        questionId: true,
        isCorrect: true,
        answeredAt: true,
      },
      orderBy: { answeredAt: 'desc' },
    })

    for (const attempt of userAttempts) {
      if (!attemptsByQuestion.has(attempt.questionId)) {
        attemptsByQuestion.set(attempt.questionId, [])
      }
      attemptsByQuestion.get(attempt.questionId)!.push({
        isCorrect: attempt.isCorrect,
        answeredAt: attempt.answeredAt,
      })
    }
  }

  // Distribuição proporcional por tema
  const perTopic = Math.floor(count / topics.length)
  const remainder = count % topics.length
  const selectedIds: string[] = []
  const usedIds = new Set<string>()

  for (let i = 0; i < topics.length; i++) {
    const limit = i === topics.length - 1 ? perTopic + remainder : perTopic
    const topicQuestions = allQuestions.filter((q) => q.topic === topics[i])

    const pool = topicQuestions.map((q) => ({
      id: q.id,
      weight: calculateWeight(attemptsByQuestion.get(q.id) ?? []),
    }))

    const chosen = weightedSampleWithoutReplacement(pool, limit)
    for (const id of chosen) {
      selectedIds.push(id)
      usedIds.add(id)
    }
  }

  // Complementar se necessário
  if (selectedIds.length < count) {
    const remaining = allQuestions
      .filter((q) => !usedIds.has(q.id))
      .map((q) => ({
        id: q.id,
        weight: calculateWeight(attemptsByQuestion.get(q.id) ?? []),
      }))

    const extra = weightedSampleWithoutReplacement(remaining, count - selectedIds.length)
    selectedIds.push(...extra)
  }

  // Embaralhar a ordem final para não ser previsível
  return selectedIds.sort(() => Math.random() - 0.5).slice(0, count)
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
  }[],
  totalQuestions: number
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
  const passed = score >= getPassingScore(totalQuestions)

  // Verificar se falhou em tema eliminatório (0 acertos no tema)
  const eliminatoryFailedTopics: Topic[] = []
  if (isOfficialExam(totalQuestions)) {
    for (const topic of EXAM_RULES.eliminatoryTopics) {
      const stats = byTopic[topic]
      if (stats && stats.total > 0 && stats.correct === 0) {
        eliminatoryFailedTopics.push(topic)
      }
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
