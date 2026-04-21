'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Lightbulb } from 'lucide-react'

interface ExplanationPanelProps {
  explanation: string
}

export function ExplanationPanel({ explanation }: ExplanationPanelProps) {
  if (!explanation) return null

  return (
    <div className="mt-4">
      <Accordion>
        <AccordionItem value="explanation" className="border border-amber-500/20 rounded-xl bg-amber-500/5 overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-amber-500/10 rounded-xl">
            <span className="flex items-center gap-2 text-amber-400 text-sm font-medium">
              <Lightbulb className="w-4 h-4" />
              Ver explicação
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {explanation}
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
