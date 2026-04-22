export const OFFICIAL_EXAM_TOTAL_QUESTIONS = 30
export const OFFICIAL_EXAM_TIME_MINUTES = 60
export const OFFICIAL_EXAM_PASSING_SCORE = 20
export const QUICK_TRAINING_QUESTION_OPTIONS = [10, 15, 20] as const
export const QUICK_TRAINING_PASSING_RATE = 0.7

export const QUESTION_OPTIONS = [
  ...QUICK_TRAINING_QUESTION_OPTIONS,
  OFFICIAL_EXAM_TOTAL_QUESTIONS,
] as const

export type ExamMode = 'official' | 'training'

export function getExamMode(totalQuestions: number): ExamMode {
  return totalQuestions === OFFICIAL_EXAM_TOTAL_QUESTIONS ? 'official' : 'training'
}

export function isOfficialExam(totalQuestions: number) {
  return getExamMode(totalQuestions) === 'official'
}

export function getPassingScore(totalQuestions: number) {
  if (isOfficialExam(totalQuestions)) return OFFICIAL_EXAM_PASSING_SCORE
  return Math.ceil(totalQuestions * QUICK_TRAINING_PASSING_RATE)
}

export function getTimeMinutes(totalQuestions: number) {
  if (isOfficialExam(totalQuestions)) return OFFICIAL_EXAM_TIME_MINUTES
  return Math.max(15, totalQuestions * 2)
}

export function getExamModeLabel(totalQuestions: number) {
  return isOfficialExam(totalQuestions) ? 'Simulado oficial' : 'Treino rápido'
}

export function getResultLabel(totalQuestions: number, passed: boolean | null) {
  if (passed === null) return 'Em andamento'
  if (isOfficialExam(totalQuestions)) return passed ? 'Aprovado' : 'Reprovado'
  return passed ? 'Meta atingida' : 'Abaixo da meta'
}
