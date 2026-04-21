import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateResult } from '@/lib/exam'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: examId } = await params

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const exam = await prisma.simulatedExam.findFirst({
      where: { id: examId, userId: user.id },
      include: {
        attempts: true,
      },
    })

    if (!exam) return NextResponse.json({ error: 'Simulado não encontrado' }, { status: 404 })
    if (exam.finishedAt) {
      return NextResponse.json({ error: 'Simulado já finalizado' }, { status: 409 })
    }

    // Calcular se cada tentativa está correta
    const attemptsWithOptions = await prisma.attempt.findMany({
      where: { examId },
      include: {
        question: {
          include: { options: true },
        },
      },
    })

    // Marcar isCorrect em cada tentativa
    for (const attempt of attemptsWithOptions) {
      if (!attempt.optionId) continue
      const correctOption = attempt.question.options.find((o) => o.isCorrect)
      const isCorrect = correctOption?.id === attempt.optionId

      await prisma.attempt.update({
        where: { id: attempt.id },
        data: { isCorrect },
      })
    }

    // Calcular resultado
    const updatedAttempts = await prisma.attempt.findMany({
      where: { examId },
      include: { question: { select: { topic: true } } },
    })

    const result = calculateResult(updatedAttempts)

    // Salvar resultado no simulado
    await prisma.simulatedExam.update({
      where: { id: examId },
      data: {
        finishedAt: new Date(),
        score: result.score,
        passed: result.passed,
      },
    })

    // Buscar questões completas com resposta correta para o resultado
    const questions = await prisma.question.findMany({
      where: { id: { in: exam.questionIds } },
      include: {
        options: { orderBy: { letter: 'asc' } },
      },
    })

    const questionMap = new Map(questions.map((q) => [q.id, q]))
    const orderedQuestions = exam.questionIds
      .map((qId: string) => questionMap.get(qId))
      .filter(Boolean)

    return NextResponse.json({
      result,
      questions: orderedQuestions,
      attempts: updatedAttempts,
    })
  } catch (error) {
    console.error('[POST /api/simulado/[id]/finish]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
