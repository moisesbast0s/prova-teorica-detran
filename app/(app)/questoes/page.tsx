import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { TOPIC_LABELS, DIFFICULTY_LABELS } from '@/types'
import { Topic, Difficulty } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuestoesFilters } from './QuestoesFilters'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Banco de Questões — DETRAN Quiz',
  description: 'Explore o banco de questões para a prova teórica do DETRAN',
}

const PAGE_SIZE = 20

const difficultyBadge: Record<Difficulty, string> = {
  FACIL: 'bg-green-500/20 text-green-400 border-green-500/30',
  MEDIO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DIFICIL: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default async function QuestoesPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; difficulty?: string; search?: string; page?: string }>
}) {
  const sp = await searchParams
  const topic = sp.topic && sp.topic !== 'all' ? (sp.topic as Topic) : undefined
  const difficulty = sp.difficulty && sp.difficulty !== 'all' ? (sp.difficulty as Difficulty) : undefined
  const search = sp.search ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1'))

  const where = {
    ...(topic ? { topic } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(search ? { statement: { contains: search, mode: 'insensitive' as const } } : {}),
  }

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      select: {
        id: true,
        statement: true,
        topic: true,
        difficulty: true,
        moduleNumber: true,
        moduloTitulo: true,
      },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.question.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function buildUrl(params: Record<string, string>) {
    const p = new URLSearchParams()
    if (params.topic && params.topic !== 'all') p.set('topic', params.topic)
    if (params.difficulty && params.difficulty !== 'all') p.set('difficulty', params.difficulty)
    if (params.search) p.set('search', params.search)
    if (params.page && params.page !== '1') p.set('page', params.page)
    const q = p.toString()
    return `/questoes${q ? `?${q}` : ''}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black gradient-text">Banco de Questões</h1>
        <p className="text-muted-foreground mt-1">
          {total.toLocaleString('pt-BR')} questões disponíveis
        </p>
      </div>

      {/* Filters — client component */}
      <QuestoesFilters
        currentTopic={topic}
        currentDifficulty={difficulty}
        currentSearch={search}
      />

      {/* Questions list */}
      <div className="space-y-3">
        {questions.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">
            Nenhuma questão encontrada.
          </div>
        )}
        {questions.map((q) => (
          <Link key={q.id} href={`/questoes/${q.id}`}>
            <div className="glass-card rounded-2xl p-4 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer mb-3">
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/10">
                  {TOPIC_LABELS[q.topic]}
                </Badge>
                <Badge variant="outline" className={cn('text-xs border', difficultyBadge[q.difficulty])}>
                  {DIFFICULTY_LABELS[q.difficulty]}
                </Badge>
                {q.moduloTitulo && (
                  <Badge variant="outline" className="text-xs text-muted-foreground border-border/50">
                    {q.moduloTitulo}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {q.statement}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link href={buildUrl({ topic: topic ?? '', difficulty: difficulty ?? '', search, page: String(page - 1) })}>
            <Button id="btn-prev-page" variant="outline" size="icon" disabled={page <= 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground px-4">
            Página {page} de {totalPages}
          </span>
          <Link href={buildUrl({ topic: topic ?? '', difficulty: difficulty ?? '', search, page: String(page + 1) })}>
            <Button id="btn-next-page" variant="outline" size="icon" disabled={page >= totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
