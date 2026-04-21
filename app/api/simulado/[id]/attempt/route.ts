import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { attemptSchema } from '@/lib/validations'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: examId } = await params

    const body = await req.json()
    const parsed = attemptSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { questionId, optionId } = parsed.data

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    // Verificar que o exame pertence ao usuário e não está finalizado
    const exam = await prisma.simulatedExam.findFirst({
      where: { id: examId, userId: user.id },
    })

    if (!exam) return NextResponse.json({ error: 'Simulado não encontrado' }, { status: 404 })
    if (exam.finishedAt) {
      return NextResponse.json({ error: 'Simulado já finalizado' }, { status: 409 })
    }

    // Verificar que a questão pertence ao simulado
    if (!exam.questionIds.includes(questionId)) {
      return NextResponse.json({ error: 'Questão não pertence a este simulado' }, { status: 400 })
    }

    // Upsert da tentativa — NÃO revelar se está correto
    const attempt = await prisma.attempt.upsert({
      where: {
        id:
          (
            await prisma.attempt.findFirst({ where: { examId, questionId } })
          )?.id ?? 'new',
      },
      update: { optionId, answeredAt: new Date() },
      create: {
        examId,
        questionId,
        optionId,
      },
    })

    return NextResponse.json({ attemptId: attempt.id })
  } catch (error) {
    console.error('[PATCH /api/simulado/[id]/attempt]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
