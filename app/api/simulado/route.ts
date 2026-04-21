import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateExam, EXAM_RULES } from '@/lib/exam'
import { createExamSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createExamSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { topics, totalQuestions } = parsed.data

    // Garantir que o usuário existe no banco
    await prisma.user.upsert({
      where: { email: session.user.email! },
      update: {},
      create: {
        email: session.user.email!,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      },
    })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const questionIds = await generateExam(topics, totalQuestions)

    if (questionIds.length < totalQuestions) {
      return NextResponse.json(
        { error: 'Questões insuficientes para os temas selecionados' },
        { status: 422 }
      )
    }

    const exam = await prisma.simulatedExam.create({
      data: {
        userId: user.id,
        topics,
        totalQuestions,
        timeMinutes: EXAM_RULES.timeMinutes,
        questionIds,
      },
    })

    return NextResponse.json({ examId: exam.id }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/simulado]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
