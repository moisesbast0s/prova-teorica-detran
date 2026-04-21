'use client'

import { cn } from '@/lib/utils'


interface OptionButtonProps {
  letter: string
  text: string
  selected: boolean
  disabled: boolean
  state?: 'correct' | 'incorrect' | 'neutral'
  onClick?: () => void
}

export function OptionButton({ letter, text, selected, disabled, state, onClick }: OptionButtonProps) {
  const letterColors: Record<string, string> = {
    a: 'bg-[#1565C0]/10 text-[#1565C0] border-[#1565C0]/30',
    b: 'bg-[#F9A825]/15 text-[#b97a00] border-[#F9A825]/40',
    c: 'bg-[#3D5229]/10 text-[#3D5229] border-[#3D5229]/30',
    d: 'bg-rose-100 text-rose-700 border-rose-300',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'option-btn w-full flex items-start gap-3 p-4 rounded-xl border text-left',
        'transition-all duration-150',
        !disabled && !selected && 'hover:border-primary/40 hover:bg-primary/5 cursor-pointer',
        disabled && 'cursor-default',
        selected && state !== 'correct' && state !== 'incorrect' && 'selected',
        state === 'correct' && 'correct',
        state === 'incorrect' && 'incorrect',
        !selected && !state && 'border-border/50 bg-card/50'
      )}
    >
      <span
        className={cn(
          'flex-shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold',
          state === 'correct' ? 'bg-green-100 text-green-700 border-green-400' :
          state === 'incorrect' ? 'bg-red-100 text-red-700 border-red-400' :
          selected ? 'bg-primary/20 text-primary border-primary/50' :
          letterColors[letter] ?? 'bg-muted text-muted-foreground border-border'
        )}
      >
        {letter.toUpperCase()}
      </span>
      <span className={cn(
        'text-sm leading-relaxed flex-1',
        state === 'correct' ? 'text-green-700' :
        state === 'incorrect' ? 'text-red-700' :
        selected ? 'text-foreground font-medium' : 'text-muted-foreground'
      )}>
        {text}
      </span>
    </button>
  )
}
