import { describe, expect, it } from 'vitest'
import { legacyExerciseFormSchema, legacyWorkoutFormSchema, sessionExerciseSchema, setLogSchema, workoutModelSchema } from './schemas'

describe('training schemas', () => {
  it('requires an active model to be unarchived', () => {
    const result = workoutModelSchema.safeParse({
      name: 'ABC',
      description: '',
      position: 0,
      isActive: true,
      isArchived: true,
    })

    expect(result.success).toBe(false)
  })

  it('accepts a completed exercise with its prescribed set records', () => {
    const result = sessionExerciseSchema.safeParse({
      sessionId: 1,
      sourceExerciseId: 2,
      name: 'Supino',
      muscle: 'Peito',
      setsReps: '3 x 12',
      restSeconds: 60,
      estimatedDurationSeconds: 0,
      tip: '',
      position: 0,
      status: 'completed',
      sets: [{
        id: 1,
        sessionExerciseId: 1,
        position: 1,
        targetRepetitions: '12',
        completed: true,
      }],
    })

    expect(result.success).toBe(true)
  })

  it('stores one load value per exercise set', () => {
    const logs = [20, 20, 25, 30].map((load, index) => setLogSchema.safeParse({
      sessionExerciseId: 1,
      position: index + 1,
      targetRepetitions: '12',
      load,
      performedRepetitions: 12,
      loggedAt: '2026-11-21T12:00:00.000Z',
    }))

    expect(logs.every((log) => log.success)).toBe(true)
    expect(logs.map((log) => log.success && log.data.load)).toEqual([20, 20, 25, 30])
  })

  it('rejects an empty required workout name', () => {
    const result = legacyWorkoutFormSchema.safeParse({
      name: ' ',
      focus: 'Empurrar',
      description: 'Peito e ombros.',
    })

    expect(result.success).toBe(false)
  })

  it('accepts valid exercise registration fields and rejects an invalid video URL', () => {
    const exercise = {
      workoutId: 1,
      name: 'Supino',
      muscle: 'Peito',
      setsReps: '3 x 12',
      rest: 60,
      tip: 'Controle a descida.',
      videoUrl: 'https://example.com/video',
    }

    expect(legacyExerciseFormSchema.safeParse(exercise).success).toBe(true)
    expect(legacyExerciseFormSchema.safeParse({ ...exercise, videoUrl: 'not-a-url' }).success).toBe(false)
  })
})
