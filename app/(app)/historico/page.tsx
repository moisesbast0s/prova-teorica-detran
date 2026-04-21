import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { TopicBreakdown } from '@/components/stats/TopicBreakdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Histórico — DETRAN Quiz',
  description: 'Veja seu histórico de simulados e evolução por tema',
}

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>
}) {
  const sp = await searchParams
  const periodo = sp.periodo ?? 'all'

  const session = await auth()
  const userEmail = session!.user!.email!
  const user = await prisma.user.findUnique({ where: { email: userEmail } })
  if (!user) redirect('/login')

  const dateFilter =
    periodo === '7d'
      ? { gte: subDays(new Date(), 7) }
      : periodo === '30d'
      ? { gte: subDays(new Date(), 30) }
      : undefined

  const exams = await prisma.simulatedExam.findMany({
    where: {
      userId: user.id,
      finishedAt: { not: null },
      ...(dateFilter ? { startedAt: dateFilter } : {}),
    },
    orderBy: { startedAt: 'desc' },
  })

  // Topic stats for this period
  const attempts = await prisma.attempt.findMany({
    where: {
      exam: {
        userId: user.id,
        finishedAt: { not: null },
        ...(dateFilter ? { startedAt: dateFilter } : {}),
      },
      isCorrect: { not: null },
    },
    include: { question: { select: { topic: true } } },
  })

  const topicStats: Record<string, { correct: number; total: number; rate: number }> = {}
  for (const a of attempts) {
    const t = a.question.topic
    if (!topicStats[t]) topicStats[t] = { correct: 0, total: 0, rate: 0 }
    topicStats[t].total++
    if (a.isCorrect) topicStats[t].correct++
  }
  for (const k of Object.keys(topicStats)) {
    const s = topicStats[k]
    s.rate = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
  }

  const periodButtons = [
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: 'all', label: 'Tudo' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black gradient-text">Histórico</h1>
          <p className="text-muted-foreground mt-1">{exams.length} simulados no período</p>
        </div>

        {/* Period filter */}
        <div className="flex gap-1 p-1 bg-muted/30 rounded-xl">
          {periodButtons.map((pb) => (
            <Link key={pb.value} href={`/historico?periodo=${pb.value}`}>
              <Button
                id={`btn-periodo-${pb.value}`}
                variant={periodo === pb.value ? 'default' : 'ghost'}
                size="sm"
                className="text-xs"
              >
                {pb.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Chart */}
      {Object.keys(topicStats).length > 0 && (
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              Taxa de Acerto por Tema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopicBreakdown data={topicStats} />
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {exams.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Nenhum simulado realizado neste período.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Data</TableHead>
                <TableHead className="text-muted-foreground text-center">Questões</TableHead>
                <TableHead className="text-muted-foreground text-center">Pontuação</TableHead>
                <TableHead className="text-muted-foreground text-center">Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam: typeof exams[0]) => (
                <TableRow key={exam.id} className="border-border/50 hover:bg-white/5">
                  <TableCell className="font-medium">
                    {format(new Date(exam.startedAt), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {exam.totalQuestions}
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    {exam.score ?? '—'}/{exam.totalQuestions}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={
                        exam.passed
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }
                    >
                      {exam.passed ? '✓ Aprovado' : '✗ Reprovado'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
