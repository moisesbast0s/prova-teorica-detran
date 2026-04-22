import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Trophy, Target, Calendar, PlayCircle, TrendingUp } from 'lucide-react'
import { PerformanceChart } from '@/components/stats/PerformanceChart'
import { TopicBreakdown } from '@/components/stats/TopicBreakdown'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Metadata } from 'next'
import { getExamModeLabel, getResultLabel } from '@/lib/exam-rules'

export const metadata: Metadata = {
  title: 'Dashboard — Simulado DETRAN',
  description: 'Acompanhe seu desempenho nos simulados do DETRAN',
}

export default async function DashboardPage() {
  const session = await auth()
  const userEmail = session!.user!.email!

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      exams: {
        where: { finishedAt: { not: null } },
        orderBy: { startedAt: 'desc' },
        take: 10,
      },
    },
  })

  const exams = user?.exams ?? []
  const totalExams = exams.length
  const positiveResults = exams.filter((e) => e.passed).length
  const avgRate =
    totalExams > 0
      ? Math.round(
          exams.reduce(
            (acc: number, e: typeof exams[0]) =>
              acc + (((e.score ?? 0) / e.totalQuestions) * 100),
            0
          ) / totalExams
        )
      : 0
  const lastExam = exams[0] ?? null

  // Topic stats
  const attempts = await prisma.attempt.findMany({
    where: {
      exam: { userId: user?.id ?? '', finishedAt: { not: null } },
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black gradient-text">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Olá, {session?.user?.name?.split(' ')[0]}! Vamos estudar hoje?
          </p>
        </div>
        <Link href="/simulado">
          <Button id="btn-novo-simulado" size="lg" className="gap-2 font-semibold">
            <PlayCircle className="w-5 h-5" />
            Novo Simulado
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Trophy className="w-5 h-5 text-amber-400" />}
          label="Atividades Realizadas"
          value={totalExams.toString()}
          sub={totalExams === 0 ? 'Comece agora!' : `${positiveResults} com resultado positivo`}
          color="amber"
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-primary" />}
          label="Média de Aproveitamento"
          value={totalExams > 0 ? `${avgRate}%` : '—'}
          sub={totalExams > 0 ? 'entre simulados e treinos' : 'Sem dados'}
          color="blue"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-green-400" />}
          label="Último Simulado"
          value={
            lastExam
              ? format(new Date(lastExam.startedAt), "dd 'de' MMM", { locale: ptBR })
              : '—'
          }
          sub={
            lastExam
              ? `${lastExam.score ?? 0}/${lastExam.totalQuestions} — ${getResultLabel(lastExam.totalQuestions, lastExam.passed)}`
              : 'Nenhum ainda'
          }
          color="green"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Evolução de Pontuação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={exams} />
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Taxa de Acerto por Tema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopicBreakdown data={topicStats} />
          </CardContent>
        </Card>
      </div>

      {/* Recent exams */}
      {exams.length > 0 && (
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Simulados Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exams.slice(0, 5).map((exam: typeof exams[0]) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(exam.startedAt), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getExamModeLabel(exam.totalQuestions)} · {exam.totalQuestions} questões
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">
                      {exam.score ?? 0}/{exam.totalQuestions}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${exam.passed
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                        }`}
                    >
                      {getResultLabel(exam.totalQuestions, exam.passed)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {totalExams === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <PlayCircle className="w-16 h-16 text-primary/40 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Comece seu primeiro simulado!</h3>
          <p className="text-muted-foreground mb-6">
            Teste seus conhecimentos sobre o Código de Trânsito Brasileiro
          </p>
          <Link href="/simulado">
            <Button id="btn-comecar-simulado" size="lg" className="gap-2">
              <PlayCircle className="w-5 h-5" />
              Iniciar Simulado
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: 'amber' | 'blue' | 'green'
}) {
  const borders: Record<string, string> = {
    amber: 'border-amber-500/20',
    blue: 'border-primary/20',
    green: 'border-green-500/20',
  }
  return (
    <Card className={`glass-card border ${borders[color]}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
            <p className="text-3xl font-black">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
          <div className="p-2 rounded-lg bg-white/5">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
