'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { TOPIC_LABELS, TOPIC_COLORS } from '@/types'
import { Topic } from '@prisma/client'

interface TopicStats {
  correct: number
  total: number
  rate: number
}

interface TopicBreakdownProps {
  data: Record<string, TopicStats>
}

interface TooltipEntry {
  payload?: {
    topic?: string
    fullName?: string
  }
}

export function TopicBreakdown({ data }: TopicBreakdownProps) {
  const chartData = Object.entries(data).map(([topic, stats]) => ({
    name: TOPIC_LABELS[topic as Topic]?.split(' ')[0] ?? topic,
    fullName: TOPIC_LABELS[topic as Topic] ?? topic,
    taxa: stats.rate,
    topic,
  }))

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        Nenhum dado disponível.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            color: '#0f172a',
            fontSize: '12px',
          }}
          formatter={(value: unknown, _: unknown, entry: TooltipEntry) => {
            const topic = entry.payload?.topic ?? ''
            const fullName = entry.payload?.fullName ?? topic
            return [`${value}% (${data[topic]?.correct ?? 0}/${data[topic]?.total ?? 0})`, fullName]
          }}
        />
        <Bar dataKey="taxa" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell
              key={entry.topic}
              fill={TOPIC_COLORS[entry.topic as Topic] ?? '#6366f1'}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
