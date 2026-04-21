import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const exam = await prisma.simulatedExam.findFirst({
      where: { id, userId: user.id },
      include: {
        attempts: true,
      },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Simulado não encontrado' }, { status: 404 })
    }

    // Buscar questões na ordem correta — SEM revelar a resposta correta
    const questions = await prisma.question.findMany({
      where: { id: { in: exam.questionIds } },
      include: {
        options: {
          select: {
            id: true,
            letter: true,
            text: true,
            // isCorrect omitido intencionalmente
          },
          orderBy: { letter: 'asc' },
        },
      },
    })

    // Reordenar questões conforme questionIds
    const questionMap = new Map(questions.map((q) => [q.id, q]))
    const orderedQuestions = exam.questionIds
      .map((qId: string) => questionMap.get(qId))
      .filter(Boolean)

    return NextResponse.json({
      exam: {
        id: exam.id,
        topics: exam.topics,
        totalQuestions: exam.totalQuestions,
        timeMinutes: exam.timeMinutes,
        startedAt: exam.startedAt,
        finishedAt: exam.finishedAt,
        score: exam.score,
        passed: exam.passed,
      },
      questions: orderedQuestions,
      attempts: exam.attempts,
    })
  } catch (error) {
    console.error('[GET /api/simulado/[id]]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
