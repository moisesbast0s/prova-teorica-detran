'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TOPIC_LABELS, DIFFICULTY_LABELS } from '@/types'
import { Topic, Difficulty } from '@prisma/client'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestoesFiltersProps {
  currentTopic?: Topic
  currentDifficulty?: Difficulty
  currentSearch?: string
}

function FiltersInner({ currentTopic, currentDifficulty, currentSearch }: QuestoesFiltersProps) {
  const router = useRouter()
  const [search, setSearch] = useState(currentSearch ?? '')
  const [topic, setTopic] = useState<string>(currentTopic ?? 'all')
  const [difficulty, setDifficulty] = useState<string>(currentDifficulty ?? 'all')

  const handleFilter = () => {
    const p = new URLSearchParams()
    if (topic && topic !== 'all') p.set('topic', topic)
    if (difficulty && difficulty !== 'all') p.set('difficulty', difficulty)
    if (search) p.set('search', search)
    router.push(`/questoes?${p.toString()}`)
  }

  const topicOptions = [
    { value: 'all', label: 'Todos os temas' },
    ...Object.values(Topic).map((t) => ({ value: t, label: TOPIC_LABELS[t] })),
  ]
  const diffOptions = [
    { value: 'all', label: 'Todas' },
    ...Object.values(Difficulty).map((d) => ({ value: d, label: DIFFICULTY_LABELS[d] })),
  ]

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-3">
      <div className="flex-1 min-w-48 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          id="input-search-questions"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
          placeholder="Buscar questão..."
          className="pl-9 bg-background/50"
        />
      </div>

      {/* Topic select */}
      <select
        id="select-topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className="h-9 rounded-lg border border-input bg-background/50 px-3 text-sm text-foreground outline-none focus:border-ring"
      >
        {topicOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Difficulty select */}
      <select
        id="select-difficulty"
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
        className="h-9 rounded-lg border border-input bg-background/50 px-3 text-sm text-foreground outline-none focus:border-ring"
      >
        {diffOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <Button id="btn-filter-questions" onClick={handleFilter} variant="outline">
        Filtrar
      </Button>
    </div>
  )
}

export function QuestoesFilters(props: QuestoesFiltersProps) {
  return (
    <Suspense fallback={<div className="glass-card rounded-2xl p-4 h-16 animate-pulse" />}>
      <FiltersInner {...props} />
    </Suspense>
  )
}
