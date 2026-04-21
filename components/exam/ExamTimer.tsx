'use client'

import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface ExamTimerProps {
  startedAt: Date
  timeMinutes: number
  onExpire: () => void
  finishedAt?: Date | null
}

export function ExamTimer({ startedAt, timeMinutes, onExpire, finishedAt }: ExamTimerProps) {
  const totalSeconds = timeMinutes * 60

  const getElapsed = useCallback(() => {
    const now = new Date()
    const start = new Date(startedAt)
    return Math.floor((now.getTime() - start.getTime()) / 1000)
  }, [startedAt])

  const [remaining, setRemaining] = useState(() => {
    const elapsed = getElapsed()
    return Math.max(0, totalSeconds - elapsed)
  })

  useEffect(() => {
    if (finishedAt) return

    const interval = setInterval(() => {
      const elapsed = getElapsed()
      const rem = Math.max(0, totalSeconds - elapsed)
      setRemaining(rem)
      if (rem === 0) {
        clearInterval(interval)
        onExpire()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [totalSeconds, getElapsed, onExpire, finishedAt])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const isCritical = remaining < 300 && remaining > 0 // < 5 min
  const pct = (remaining / totalSeconds) * 100

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all',
        isCritical
          ? 'border-red-500/50 bg-red-500/10 timer-critical'
          : 'border-border/50 bg-card/50'
      )}
    >
      <Clock className={cn('w-4 h-4', isCritical ? 'text-red-400' : 'text-muted-foreground')} />
      <span
        className={cn(
          'font-mono font-bold text-lg tabular-nums',
          isCritical ? 'text-red-400' : 'text-foreground'
        )}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  )
}
