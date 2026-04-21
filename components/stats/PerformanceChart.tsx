'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ExamData {
  id: string
  startedAt: Date | string
  score: number | null
  totalQuestions: number
  passed: boolean | null
}

interface PerformanceChartProps {
  data: ExamData[]
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const chartData = [...data]
    .reverse()
    .slice(-10)
    .map((exam) => ({
      name: format(new Date(exam.startedAt), 'dd/MM', { locale: ptBR }),
      pontuacao: exam.score ?? 0,
      total: exam.totalQuestions,
      passed: exam.passed,
    }))

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        Nenhum simulado realizado ainda.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="name"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
          domain={[0, 30]}
        />
        <Tooltip
          contentStyle={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            color: '#0f172a',
            fontSize: '12px',
          }}
          formatter={(value: unknown) => [`${value} acertos`, 'Pontuação']}
        />
        <ReferenceLine y={21} stroke="#F9A825" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="pontuacao"
          stroke="#1565C0"
          strokeWidth={2.5}
          dot={{ fill: '#1565C0', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
