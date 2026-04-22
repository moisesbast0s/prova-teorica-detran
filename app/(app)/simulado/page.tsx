'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TOPIC_LABELS, TOPIC_COLORS } from '@/types'
import { Topic } from '@prisma/client'
import { PlayCircle, Clock, BookOpen, CheckSquare, GraduationCap, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  OFFICIAL_EXAM_PASSING_SCORE,
  QUESTION_OPTIONS,
  getExamModeLabel,
  getPassingScore,
  getTimeMinutes,
  isOfficialExam,
} from '@/lib/exam-rules'

const ALL_TOPICS = Object.values(Topic)

export default function SimuladoPage() {
  const router = useRouter()
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>(ALL_TOPICS)
  const [totalQuestions, setTotalQuestions] = useState(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const allSelected = selectedTopics.length === ALL_TOPICS.length

  const toggleTopic = (topic: Topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )
  }

  const toggleAll = () => {
    setSelectedTopics(allSelected ? [] : ALL_TOPICS)
  }

  const estimatedTime = getTimeMinutes(totalQuestions)
  const official = isOfficialExam(totalQuestions)
  const passingScore = getPassingScore(totalQuestions)

  const handleStart = async () => {
    if (selectedTopics.length === 0) {
      setError('Selecione ao menos um tema.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/simulado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics: selectedTopics, totalQuestions }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao criar simulado.')
        setLoading(false)
        return
      }
      router.push(`/simulado/${data.examId}`)
    } catch {
      setError('Erro de conexão.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black gradient-text">Novo Simulado</h1>
        <p className="text-muted-foreground mt-1">
          Escolha treino rápido ou prova no formato oficial
        </p>
      </div>

      {/* Topics */}
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Temas
            </CardTitle>
            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ALL_TOPICS.map((topic) => {
              const checked = selectedTopics.includes(topic)
              const color = TOPIC_COLORS[topic]
              return (
                <label
                  key={topic}
                  htmlFor={`topic-${topic}`}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                    checked
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border/50 hover:border-border hover:bg-muted/20'
                  )}
                >
                  <Checkbox
                    id={`topic-${topic}`}
                    checked={checked}
                    onCheckedChange={() => toggleTopic(topic)}
                  />
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium">{TOPIC_LABELS[topic]}</span>
                  </div>
                </label>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Questions count */}
      <Card className="glass-card border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              {official ? (
                <GraduationCap className="w-4 h-4 text-primary" />
              ) : (
                <Zap className="w-4 h-4 text-primary" />
              )}
              {getExamModeLabel(totalQuestions)}
            </Label>
            <span className="text-2xl font-black text-primary">{totalQuestions}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUESTION_OPTIONS.map((n) => (
              <button
                key={n}
                id={`btn-questions-${n}`}
                onClick={() => setTotalQuestions(n)}
                className={cn(
                  'flex-1 py-3 rounded-xl border text-sm font-semibold transition-all',
                  totalQuestions === n
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-border/50 bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                <span className="block">{n}</span>
                <span className="block text-[11px] font-medium opacity-70">
                  {isOfficialExam(n) ? 'Oficial' : 'Treino'}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {official
              ? `Aprovação com ${OFFICIAL_EXAM_PASSING_SCORE} acertos em 30 questões.`
              : `Meta de treino: ${passingScore} acertos (${Math.round((passingScore / totalQuestions) * 100)}%).`}
          </p>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
        <Clock className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Tempo estimado</p>
          <p className="text-xs text-muted-foreground">
            {estimatedTime} minutos · {totalQuestions} questões · {selectedTopics.length} temas
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          {error}
        </p>
      )}

      <Button
        id="btn-iniciar-simulado"
        onClick={handleStart}
        disabled={loading || selectedTopics.length === 0}
        size="lg"
        className="w-full h-12 text-base font-bold gap-2"
      >
        <PlayCircle className="w-5 h-5" />
        {loading ? 'Criando simulado...' : 'Iniciar Simulado'}
      </Button>
    </div>
  )
}
