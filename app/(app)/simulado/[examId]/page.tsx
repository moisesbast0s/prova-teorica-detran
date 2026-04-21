'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ExamTimer } from '@/components/exam/ExamTimer'
import { ExamProgress } from '@/components/exam/ExamProgress'
import { QuestionCard } from '@/components/question/QuestionCard'
import { OptionButton } from '@/components/question/OptionButton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import { use } from 'react'
import type { Difficulty, Topic } from '@prisma/client'

interface Option {
  id: string
  letter: string
  text: string
}

interface Question {
  id: string
  statement: string
  imageUrl?: string | null
  topic: Topic
  difficulty: Difficulty
  moduleNumber?: number | null
  moduloTitulo?: string | null
  codigoPlaca?: string | null
  options: Option[]
}

interface Exam {
  id: string
  topics: Topic[]
  totalQuestions: number
  timeMinutes: number
  startedAt: string
  finishedAt: string | null
}

export default function ExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params)
  const router = useRouter()

  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [attempts, setAttempts] = useState<Record<string, string>>({}) // questionId -> optionId
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [finishing, setFinishing] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const submittingRef = useRef(false)

  // Load exam
  useEffect(() => {
    fetch(`/api/simulado/${examId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.exam?.finishedAt) {
          router.replace(`/simulado/${examId}/resultado`)
          return
        }
        setExam(data.exam)
        setQuestions(data.questions ?? [])
        // Restore attempts
        const restored: Record<string, string> = {}
        for (const a of data.attempts ?? []) {
          if (a.optionId) restored[a.questionId] = a.optionId
        }
        setAttempts(restored)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [examId, router])

  const handleAnswer = useCallback(
    async (questionId: string, optionId: string) => {
      setAttempts((prev) => ({ ...prev, [questionId]: optionId }))
      // Fire and forget — optimistic update
      fetch(`/api/simulado/${examId}/attempt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, optionId }),
      }).catch(console.error)
    },
    [examId]
  )

  const handleFinish = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setFinishing(true)

    try {
      const res = await fetch(`/api/simulado/${examId}/finish`, { method: 'POST' })
      if (res.ok) {
        router.push(`/simulado/${examId}/resultado`)
      }
    } catch {
      setFinishing(false)
      submittingRef.current = false
    }
  }, [examId, router])

  const handleFinishClick = () => {
    const answeredCount = Object.keys(attempts).length
    const total = questions.length
    if (answeredCount < total) {
      setShowConfirmDialog(true)
    } else {
      handleFinish()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-muted-foreground animate-pulse">Carregando simulado...</div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-muted-foreground">Simulado não encontrado.</p>
      </div>
    )
  }

  const currentQuestion = questions[currentIdx]
  const answeredSet = new Set(Object.keys(attempts))
  const questionIds = questions.map((q) => q.id)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <ExamTimer
          startedAt={new Date(exam.startedAt)}
          timeMinutes={exam.timeMinutes}
          onExpire={handleFinish}
          finishedAt={exam.finishedAt ? new Date(exam.finishedAt) : null}
        />
        <Button
          id="btn-finalizar-prova"
          onClick={handleFinishClick}
          disabled={finishing}
          variant="destructive"
          className="gap-2 font-semibold"
        >
          <Flag className="w-4 h-4" />
          {finishing ? 'Finalizando...' : 'Finalizar Prova'}
        </Button>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Question */}
        <div className="space-y-4">
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIdx + 1}
              totalQuestions={questions.length}
            >
              {currentQuestion.options.map((opt) => (
                <OptionButton
                  key={opt.id}
                  letter={opt.letter}
                  text={opt.text}
                  selected={attempts[currentQuestion.id] === opt.id}
                  disabled={false}
                  onClick={() => handleAnswer(currentQuestion.id, opt.id)}
                />
              ))}
            </QuestionCard>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              id="btn-prev-question"
              variant="outline"
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            <Button
              id="btn-next-question"
              variant="outline"
              onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
              disabled={currentIdx === questions.length - 1}
              className="gap-2"
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress sidebar */}
        <div className="lg:sticky lg:top-24 h-fit">
          <ExamProgress
            total={questions.length}
            answered={answeredSet.size}
            current={currentIdx}
            answeredIds={answeredSet}
            questionIds={questionIds}
            onNavigate={(i) => setCurrentIdx(i)}
          />
        </div>
      </div>

      {/* Confirm dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar prova?</DialogTitle>
            <DialogDescription>
              Você deixou {questions.length - Object.keys(attempts).length} questão(ões) sem
              resposta. Deseja mesmo finalizar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Continuar respondendo
            </Button>
            <Button
              id="btn-confirmar-finalizar"
              variant="destructive"
              onClick={() => {
                setShowConfirmDialog(false)
                handleFinish()
              }}
            >
              Finalizar mesmo assim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
