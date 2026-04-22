import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ResultSummary } from '@/components/exam/ResultSummary'
import { QuestionCard } from '@/components/question/QuestionCard'
import { OptionButton } from '@/components/question/OptionButton'
import { ExplanationPanel } from '@/components/question/ExplanationPanel'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlayCircle, History } from 'lucide-react'
import { calculateResult } from '@/lib/exam'
import { Option, Question } from '@prisma/client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resultado — DETRAN Quiz',
}



type QuestionWithOptions = Question & { options: Option[] }

export default async function ResultadoPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params
  const session = await auth()
  const userEmail = session!.user!.email!

  const user = await prisma.user.findUnique({ where: { email: userEmail } })
  if (!user) redirect('/login')

  const exam = await prisma.simulatedExam.findFirst({
    where: { id: examId, userId: user.id },
    include: {
      attempts: {
        include: { question: { select: { topic: true } } },
      },
    },
  })

  if (!exam) notFound()
  if (!exam.finishedAt) redirect(`/simulado/${examId}`)

  // Fetch full questions with correct answers
  const questions = await prisma.question.findMany({
    where: { id: { in: exam.questionIds } },
    include: { options: { orderBy: { letter: 'asc' } } },
  })

  const questionMap = new Map<string, QuestionWithOptions>(questions.map((q) => [q.id, q]))
  const orderedQuestions = exam.questionIds
    .map((qId: string) => questionMap.get(qId))
    .filter((q): q is QuestionWithOptions => q !== undefined)

  // Build attempt map
  const attemptMap = new Map(exam.attempts.map((a) => [a.questionId, a]))

  const result = calculateResult(exam.attempts, exam.totalQuestions)

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black gradient-text">Resultado</h1>
        <div className="flex gap-2">
          <Link href="/simulado">
            <Button id="btn-novo-simulado-resultado" variant="outline" className="gap-2">
              <PlayCircle className="w-4 h-4" />
              Novo Simulado
            </Button>
          </Link>
          <Link href="/historico">
            <Button id="btn-historico-resultado" variant="ghost" className="gap-2">
              <History className="w-4 h-4" />
              Histórico
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary */}
      <ResultSummary result={result} totalQuestions={exam.totalQuestions} />

      {/* Questions review */}
      <div>
        <h2 className="text-lg font-bold mb-4">Revisão das Questões</h2>
        <div className="space-y-4">
          {orderedQuestions.map((question, idx) => {
            const attempt = attemptMap.get(question.id)
            const userOptionId = attempt?.optionId ?? null

            return (
              <QuestionCard
                key={question.id}
                question={question}
                questionNumber={idx + 1}
                totalQuestions={orderedQuestions.length}
              >
                {question.options.map((opt: Option) => {
                  let state: 'correct' | 'incorrect' | undefined
                  if (opt.isCorrect) state = 'correct'
                  else if (userOptionId === opt.id && !opt.isCorrect) state = 'incorrect'

                  return (
                    <OptionButton
                      key={opt.id}
                      letter={opt.letter}
                      text={opt.text}
                      selected={userOptionId === opt.id}
                      disabled={true}
                      state={state}
                    />
                  )
                })}
                <ExplanationPanel explanation={question.explanation} />
              </QuestionCard>
            )
          })}
        </div>
      </div>
    </div>
  )
}
