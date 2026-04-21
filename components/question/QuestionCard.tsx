'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TOPIC_LABELS, DIFFICULTY_LABELS } from '@/types'
import { Topic, Difficulty } from '@prisma/client'
import { QuestionImage } from './QuestionImage'

interface Option {
  id: string
  letter: string
  text: string
}

interface QuestionCardProps {
  question: {
    id: string
    statement: string
    topic: Topic
    difficulty: Difficulty
    imageUrl?: string | null
    moduleNumber?: number | null
    moduloTitulo?: string | null
    codigoPlaca?: string | null
    options: Option[]
  }
  questionNumber: number
  totalQuestions: number
  children?: React.ReactNode // slot for OptionButtons
}

const difficultyStyles: Record<Difficulty, string> = {
  FACIL: 'bg-green-500/20 text-green-400 border-green-500/30',
  MEDIO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DIFICIL: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export function QuestionCard({ question, questionNumber, totalQuestions, children }: QuestionCardProps) {
  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground font-medium">
          Questão {questionNumber} de {totalQuestions}
        </span>
        <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/10">
          {TOPIC_LABELS[question.topic]}
        </Badge>
        <Badge variant="outline" className={cn('text-xs border', difficultyStyles[question.difficulty])}>
          {DIFFICULTY_LABELS[question.difficulty]}
        </Badge>
      </div>

      {/* Statement */}
      <p className="text-base font-medium text-foreground leading-relaxed mb-6 whitespace-pre-line">
        {question.statement}
      </p>

      <QuestionImage
        imageUrl={question.imageUrl}
        codigoPlaca={question.codigoPlaca}
        className="mb-6"
      />

      {/* Options slot */}
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </div>
  )
}
