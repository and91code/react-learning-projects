import { z } from 'zod'

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.').refine((value) => {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}, 'Informe uma data válida.')

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome.').max(80),
  photoDataUrl: z.string().nullable(),
})

export const workoutModelSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do modelo.').max(60),
  description: z.string().trim().max(180),
  position: z.number().int().nonnegative(),
  isActive: z.boolean(),
  isArchived: z.boolean(),
}).refine((model) => !model.isArchived || !model.isActive, {
  message: 'Um modelo arquivado não pode ser o modelo ativo.',
  path: ['isActive'],
})

export const workoutModelFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do modelo.').max(60),
  description: z.string().trim().max(180),
})

export const trainingRoutineSchema = z.object({
  modelId: z.number().int().positive(),
  name: z.string().trim().min(1, 'Informe o nome do treino.').max(60),
  focus: z.string().trim().max(80),
  description: z.string().trim().max(180),
  position: z.number().int().nonnegative(),
})

export const setPrescriptionSchema = z.object({
  position: z.number().int().positive(),
  targetRepetitions: z.number().int().positive(),
})

export const exerciseDefinitionSchema = z.object({
  routineId: z.number().int().positive(),
  name: z.string().trim().min(1, 'Informe o nome do exercício.').max(80),
  muscle: z.string().trim().min(1, 'Informe o grupo muscular.').max(80),
  position: z.number().int().nonnegative(),
  restSeconds: z.number().int().nonnegative().max(3600),
  estimatedDurationSeconds: z.number().int().positive().max(86400),
  tip: z.string().trim().max(500),
  videoUrl: z.union([z.literal(''), z.string().url('Informe uma URL válida.')]).optional(),
  sets: z.array(setPrescriptionSchema).min(1, 'Adicione ao menos uma série.'),
})

export const trainingSessionSchema = z.object({
  modelId: z.number().int().positive(),
  routineId: z.number().int().positive().optional(),
  routineName: z.string().trim().min(1),
  trainingDate: dateOnlySchema,
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
  status: z.enum(['in_progress', 'completed', 'partial', 'stopped']),
  currentExerciseId: z.number().int().positive().optional(),
  currentSetPosition: z.number().int().positive().optional(),
  restStartedAt: z.string().datetime().optional(),
  restDurationSeconds: z.number().int().nonnegative().optional(),
  secondsPerSet: z.number().int().positive().max(600),
})

export const sessionExerciseSchema = z.object({
  sessionId: z.number().int().positive(),
  sourceExerciseId: z.number().int().positive().optional(),
  name: z.string().trim().min(1),
  muscle: z.string(),
  setsReps: z.string(),
  restSeconds: z.number().int().nonnegative(),
  estimatedDurationSeconds: z.number().int().nonnegative(),
  tip: z.string(),
  videoUrl: z.string().optional(),
  position: z.number().int().nonnegative(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'skipped']),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  sets: z.array(z.object({
    id: z.number().int().positive(),
    sessionExerciseId: z.number().int().positive(),
    position: z.number().int().positive(),
    targetRepetitions: z.string(),
    load: z.number().nonnegative().optional(),
    performedRepetitions: z.number().int().positive().optional(),
    loggedAt: z.string().datetime().optional(),
    completed: z.boolean(),
  })),
})

export const setLogSchema = z.object({
  sessionExerciseId: z.number().int().positive(),
  position: z.number().int().positive(),
  targetRepetitions: z.string().min(1),
  load: z.number().nonnegative().optional(),
  performedRepetitions: z.number().int().positive().optional(),
  loggedAt: z.string().datetime().optional(),
  completed: z.boolean().optional(),
})

export const legacyWorkoutFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do treino.').max(60),
  focus: z.string().trim().min(1, 'Informe o foco do treino.').max(60),
  description: z.string().trim().min(1, 'Informe uma descrição.').max(180),
})

export const legacyExerciseFormSchema = z.object({
  workoutId: z.number().int().positive('Selecione um treino.'),
  name: z.string().trim().min(1, 'Informe o nome do exercício.').max(80),
  muscle: z.string().trim().min(1, 'Informe o grupo muscular.').max(60),
  setsReps: z.string().trim().min(1, 'Informe as séries e repetições.').max(30),
  rest: z.number().int().min(0).max(3600),
  tip: z.string().trim().min(1, 'Informe uma dica de execução.').max(220),
  videoUrl: z.union([z.literal(''), z.string().url('Informe uma URL válida.')]).optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>
export type WorkoutModelInput = z.infer<typeof workoutModelSchema>
export type WorkoutModelFormInput = z.infer<typeof workoutModelFormSchema>
export type TrainingRoutineInput = z.infer<typeof trainingRoutineSchema>
export type ExerciseDefinitionInput = z.infer<typeof exerciseDefinitionSchema>
export type LegacyWorkoutFormInput = z.infer<typeof legacyWorkoutFormSchema>
export type LegacyExerciseFormInput = z.infer<typeof legacyExerciseFormSchema>
