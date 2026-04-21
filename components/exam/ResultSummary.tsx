'use client'

import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TOPIC_LABELS, TOPIC_COLORS } from '@/types'
import { Topic } from '@prisma/client'
import { ExamResult } from '@/types'

interface ResultSummaryProps {
  result: ExamResult
  totalQuestions: number
}

export function ResultSummary({ result, totalQuestions }: ResultSummaryProps) {
  const pct = Math.round((result.score / totalQuestions) * 100)

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div
        className={cn(
          'glass-card rounded-2xl p-8 text-center border-2',
          result.passed ? 'border-green-500/40' : 'border-red-500/40'
        )}
      >
        {result.passed ? (
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
        ) : (
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        )}

        <div className="text-5xl font-black mb-2">
          <span className={result.passed ? 'text-green-400' : 'text-red-400'}>
            {result.score}
          </span>
          <span className="text-muted-foreground text-3xl"> / {totalQuestions}</span>
        </div>

        <p
          className={cn(
            'text-xl font-bold tracking-wide',
            result.passed ? 'text-green-400' : 'text-red-400'
          )}
        >
          {result.passed ? '✓ APROVADO' : '✗ REPROVADO'}
        </p>

        <p className="text-muted-foreground text-sm mt-1">{pct}% de acertos</p>

        {result.eliminatoryFailed && (
          <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <p className="text-sm text-orange-300">
              Reprovado por questão eliminatória:{' '}
              {result.eliminatoryFailedTopics
                .map((t) => TOPIC_LABELS[t as Topic])
                .join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Breakdown by topic */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Desempenho por Tema
        </h3>
        <div className="space-y-3">
          {Object.entries(result.byTopic).map(([topic, stats]) => {
            const rate = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
            const color = TOPIC_COLORS[topic as Topic] ?? '#6366f1'
            return (
              <div key={topic}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">
                    {TOPIC_LABELS[topic as Topic]}
                  </span>
                  <span className="text-sm font-medium">
                    {stats.correct}/{stats.total}
                    <span className="text-muted-foreground ml-1 text-xs">({rate}%)</span>
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${rate}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
