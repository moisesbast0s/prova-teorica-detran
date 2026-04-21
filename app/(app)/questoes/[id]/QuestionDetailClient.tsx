'use client'

import { useState } from 'react'
import { OptionButton } from '@/components/question/OptionButton'
import { ExplanationPanel } from '@/components/question/ExplanationPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TOPIC_LABELS, DIFFICULTY_LABELS } from '@/types'
import { Topic, Difficulty } from '@prisma/client'
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'
import { QuestionImage } from '@/components/question/QuestionImage'

interface Option {
  id: string
  letter: string
  text: string
  isCorrect: boolean
}

interface QuestionDetailClientProps {
  question: {
    id: string
    statement: string
    imageUrl: string | null
    topic: Topic
    difficulty: Difficulty
    explanation: string
    moduloTitulo: string | null
    codigoPlaca: string | null
    options: Option[]
  }
}

const difficultyBadge: Record<Difficulty, string> = {
  FACIL: 'bg-green-500/20 text-green-400 border-green-500/30',
  MEDIO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DIFICIL: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export function QuestionDetailClient({ question }: QuestionDetailClientProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)

  const handleSelect = (optId: string) => {
    if (!revealed) setSelected(optId)
  }

  return (
    <div className="space-y-6">
      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
          {TOPIC_LABELS[question.topic]}
        </Badge>
        <Badge variant="outline" className={cn('border', difficultyBadge[question.difficulty])}>
          {DIFFICULTY_LABELS[question.difficulty]}
        </Badge>
        {question.moduloTitulo && (
          <Badge variant="outline" className="text-muted-foreground border-border/50">
            {question.moduloTitulo}
          </Badge>
        )}
      </div>

      {/* Statement */}
      <p className="text-lg font-medium leading-relaxed whitespace-pre-line">
        {question.statement}
      </p>

      <QuestionImage imageUrl={question.imageUrl} codigoPlaca={question.codigoPlaca} />

      {/* Options */}
      <div className="flex flex-col gap-2">
        {question.options.map((opt) => {
          let state: 'correct' | 'incorrect' | undefined
          if (revealed) {
            if (opt.isCorrect) state = 'correct'
            else if (selected === opt.id) state = 'incorrect'
          }
          return (
            <OptionButton
              key={opt.id}
              letter={opt.letter}
              text={opt.text}
              selected={selected === opt.id}
              disabled={revealed}
              state={state}
              onClick={() => handleSelect(opt.id)}
            />
          )
        })}
      </div>

      {/* Reveal button */}
      <Button
        id="btn-ver-gabarito"
        variant={revealed ? 'outline' : 'default'}
        onClick={() => setRevealed((r) => !r)}
        className="gap-2"
      >
        {revealed ? (
          <>
            <EyeOff className="w-4 h-4" /> Ocultar Gabarito
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" /> Ver Gabarito
          </>
        )}
      </Button>

      {/* Explanation */}
      {revealed && <ExplanationPanel explanation={question.explanation} />}
    </div>
  )
}
