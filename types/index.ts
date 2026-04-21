import { Topic, Difficulty } from '@prisma/client'

export type { Topic, Difficulty }

export interface QuestionWithOptions {
  id: string
  externalId: string
  statement: string
  imageUrl: string | null
  topic: Topic
  difficulty: Difficulty
  explanation: string
  moduleNumber: number | null
  moduloTitulo: string | null
  codigoPlaca: string | null
  options: OptionItem[]
  createdAt: Date
}

export interface OptionItem {
  id: string
  letter: string
  text: string
  isCorrect: boolean
  questionId: string
}

export interface ExamWithDetails {
  id: string
  userId: string
  topics: Topic[]
  totalQuestions: number
  timeMinutes: number
  startedAt: Date
  finishedAt: Date | null
  score: number | null
  passed: boolean | null
  questionIds: string[]
  attempts: AttemptItem[]
  questions?: QuestionWithOptions[]
}

export interface AttemptItem {
  id: string
  examId: string
  questionId: string
  optionId: string | null
  isCorrect: boolean | null
  answeredAt: Date
}

export interface ExamResult {
  score: number
  passed: boolean
  eliminatoryFailed: boolean
  eliminatoryFailedTopics: Topic[]
  byTopic: Record<string, { correct: number; total: number; topic: Topic }>
}

export interface StatsData {
  totalExams: number
  avgScore: number
  lastExams: {
    id: string
    startedAt: Date
    finishedAt: Date | null
    score: number | null
    passed: boolean | null
    totalQuestions: number
  }[]
  topicStats: Record<string, { correct: number; total: number; rate: number }>
}

export const TOPIC_LABELS: Record<Topic, string> = {
  LEGISLACAO_TRANSITO: 'Legislação de Trânsito',
  SINALIZACAO_VIARIA: 'Sinalização Viária',
  DIRECAO_DEFENSIVA: 'Direção Defensiva',
  PRIMEIROS_SOCORROS: 'Primeiros Socorros',
  MEIO_AMBIENTE: 'Meio Ambiente',
  MECANICA_BASICA: 'Mecânica Básica',
  CIDADANIA: 'Cidadania',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  FACIL: 'Fácil',
  MEDIO: 'Médio',
  DIFICIL: 'Difícil',
}

export const TOPIC_COLORS: Record<Topic, string> = {
  LEGISLACAO_TRANSITO: '#3D5229',
  SINALIZACAO_VIARIA: '#F9A825',
  DIRECAO_DEFENSIVA: '#1565C0',
  PRIMEIROS_SOCORROS: '#d32f2f',
  MEIO_AMBIENTE: '#558b2f',
  MECANICA_BASICA: '#455a64',
  CIDADANIA: '#f57c00',
}
