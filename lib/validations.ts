import { z } from 'zod'
import { QUESTION_OPTIONS } from '@/lib/exam-rules'


const TopicEnum = z.enum([
  'LEGISLACAO_TRANSITO',
  'SINALIZACAO_VIARIA',
  'DIRECAO_DEFENSIVA',
  'PRIMEIROS_SOCORROS',
  'MEIO_AMBIENTE',
  'MECANICA_BASICA',
  'CIDADANIA',
])

export const createExamSchema = z.object({
  topics: z.array(TopicEnum).min(1, 'Selecione ao menos um tema'),
  totalQuestions: z
    .number()
    .int()
    .refine((value): value is (typeof QUESTION_OPTIONS)[number] => {
      return QUESTION_OPTIONS.includes(value as (typeof QUESTION_OPTIONS)[number])
    }, 'Escolha 10, 15, 20 ou 30 questões'),
})

export const attemptSchema = z.object({
  questionId: z.string().min(1),
  optionId: z.string().min(1),
})

export const questionsFilterSchema = z.object({
  topic: TopicEnum.optional(),
  difficulty: z.enum(['FACIL', 'MEDIO', 'DIFICIL']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type CreateExamInput = z.infer<typeof createExamSchema>
export type AttemptInput = z.infer<typeof attemptSchema>
export type QuestionsFilterInput = z.infer<typeof questionsFilterSchema>
