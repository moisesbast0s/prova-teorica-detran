import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { QuestionDetailClient } from './QuestionDetailClient'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const q = await prisma.question.findUnique({ where: { id }, select: { statement: true } })
  return {
    title: q ? `${q.statement.slice(0, 60)}... — DETRAN Quiz` : 'Questão — DETRAN Quiz',
  }
}

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const question = await prisma.question.findUnique({
    where: { id },
    include: { options: { orderBy: { letter: 'asc' } } },
  })

  if (!question) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/questoes">
          <Button id="btn-back-questions" variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Questão</h1>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <QuestionDetailClient question={question} />
      </div>
    </div>
  )
}
