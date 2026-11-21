export type WorkoutModel = {
  id: number
  name: string
  description: string
  position: number
  isActive: boolean
  isArchived: boolean
}

export type TrainingRoutine = {
  id: number
  modelId: number
  name: string
  focus: string
  description: string
  position: number
}

export type ExerciseDefinition = {
  id: number
  routineId: number
  name: string
  muscle: string
  position: number
  restSeconds: number
  estimatedDurationSeconds: number
  tip: string
  videoUrl?: string
  sets: SetPrescription[]
}

export type SetPrescription = {
  id: number
  exerciseId: number
  position: number
  targetRepetitions: number
}

export type SessionStatus = 'in_progress' | 'completed' | 'partial' | 'stopped'
export type SessionExerciseStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped'

export type TrainingSession = {
  id: number
  modelId: number
  routineId?: number
  routineName: string
  trainingDate: string
  startedAt: string
  finishedAt?: string
  status: SessionStatus
  currentExerciseId?: number
  currentSetPosition?: number
  restStartedAt?: string
  restDurationSeconds?: number
  secondsPerSet: number
}

export type SessionExercise = {
  id: number
  sessionId: number
  sourceExerciseId?: number
  name: string
  muscle: string
  setsReps: string
  restSeconds: number
  estimatedDurationSeconds: number
  tip: string
  videoUrl?: string
  position: number
  status: SessionExerciseStatus
  startedAt?: string
  completedAt?: string
  sets: SessionSet[]
}

export type SessionSet = {
  id: number
  sessionExerciseId: number
  position: number
  targetRepetitions: string
  load?: number
  performedRepetitions?: number
  loggedAt?: string
  completed: boolean
}

export type SetLog = SessionSet
