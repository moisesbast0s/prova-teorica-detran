'use client'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ExamProgressProps {
  total: number
  answered: number
  current: number
  answeredIds: Set<string>
  questionIds: string[]
  onNavigate: (index: number) => void
}

export function ExamProgress({
  total,
  answered,
  current,
  answeredIds,
  questionIds,
  onNavigate,
}: ExamProgressProps) {
  const pct = Math.round((answered / total) * 100)

  return (
    <div className="glass-card rounded-2xl p-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Progresso</span>
        <span className="text-xs font-medium text-primary">
          {answered}/{total} respondidas
        </span>
      </div>
      <Progress value={pct} className="h-2 mb-4 progress-glow" />

      {/* Question grid */}
      <div className="grid grid-cols-6 gap-1.5">
        {questionIds.map((qId, i) => {
          const isAnswered = answeredIds.has(qId)
          const isCurrent = i === current
          return (
            <button
              key={qId}
              onClick={() => onNavigate(i)}
              className={cn(
                'h-8 w-full rounded-lg text-xs font-medium transition-all duration-150',
                isCurrent
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/50 ring-offset-1 ring-offset-background'
                  : isAnswered
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                  : 'bg-muted/50 text-muted-foreground border border-border/50 hover:bg-muted'
              )}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
