import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Topic } from '@prisma/client'
import { TOPIC_LABELS } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const allExams = await prisma.simulatedExam.findMany({
      where: { userId: user.id, finishedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
    })

    const totalExams = allExams.length
    const avgScore =
      totalExams > 0
        ? Math.round(
          allExams.reduce((acc, e) => acc + (e.score ?? 0), 0) / totalExams
        )
        : 0

    const lastExams = allExams.slice(0, 10).map((e) => ({
      id: e.id,
      startedAt: e.startedAt,
      finishedAt: e.finishedAt,
      score: e.score,
      passed: e.passed,
      totalQuestions: e.totalQuestions,
    }))

    // Estatísticas por tema via tentativas
    const attempts = await prisma.attempt.findMany({
      where: {
        exam: { userId: user.id, finishedAt: { not: null } },
        isCorrect: { not: null },
      },
      include: { question: { select: { topic: true } } },
    })

    const topicStats: Record<string, { correct: number; total: number; rate: number }> = {}

    for (const attempt of attempts) {
      const topic = attempt.question.topic
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0, rate: 0 }
      }
      topicStats[topic].total++
      if (attempt.isCorrect) topicStats[topic].correct++
    }

    for (const key of Object.keys(topicStats)) {
      const s = topicStats[key]
      s.rate = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
    }

    return NextResponse.json({
      totalExams,
      avgScore,
      lastExams,
      topicStats,
    })
  } catch (error) {
    console.error('[GET /api/stats]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
