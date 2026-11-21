import sqlite3InitModule from '@sqlite.org/sqlite-wasm'
import { beforeAll, describe, expect, it } from 'vitest'
import { createModel } from './model-repository'
import { migrateDatabase } from './migrations'
import { createRoutine, createRoutineExercise } from './routine-repository'
import { finishTrainingSession, getTrainingSession, saveSessionSet, startSessionExercise, startTrainingSession } from './session-repository'
import type { SqliteDatabase, SqliteModule } from './types'

let sqlite3: SqliteModule

beforeAll(async () => {
  sqlite3 = await sqlite3InitModule()
})

function sessionWithThreeSets() {
  const db = new sqlite3.oo1.DB(':memory:') as SqliteDatabase
  migrateDatabase(db)
  const modelId = createModel(db, { name: 'Push', description: '' })
  const routineId = createRoutine(db, modelId, { name: 'Treino A', focus: '', description: '' })
  createRoutineExercise(db, {
    routineId,
    name: 'Supino reto',
    muscle: 'Peito',
    setsReps: '3 x 12',
    rest: 60,
    tip: '',
    videoUrl: '',
  })
  const sessionId = startTrainingSession(db, routineId, new Date('2026-11-21T12:00:00.000Z'))
  const snapshot = getTrainingSession(db, sessionId)
  if (!snapshot) throw new Error('A sessão deveria ter sido criada.')
  return { db, sessionId, exercise: snapshot.exercises[0] }
}

describe('session repository', () => {
  it('cria uma série por quantidade prescrita e mantém cargas independentes', () => {
    const { db, sessionId, exercise } = sessionWithThreeSets()

    expect(exercise.sets).toHaveLength(3)
    startSessionExercise(db, exercise.id)
    saveSessionSet(db, exercise.sets[0].id, { load: 20, performedRepetitions: 12 })
    saveSessionSet(db, exercise.sets[1].id, { load: 25, performedRepetitions: 10 })

    const snapshot = getTrainingSession(db, sessionId)
    expect(snapshot?.exercises[0].sets.map((set) => set.load)).toEqual([20, 25, null])
    expect(snapshot?.exercises[0].status).toBe('in_progress')
  })

  it('marca o exercício como concluído automaticamente ao registrar todas as séries', () => {
    const { db, sessionId, exercise } = sessionWithThreeSets()
    startSessionExercise(db, exercise.id)

    for (const set of exercise.sets) {
      saveSessionSet(db, set.id, { completed: true })
      expect(getTrainingSession(db, sessionId)?.exercises[0].status).toBe(
        set.position === exercise.sets.length ? 'completed' : 'in_progress',
      )
    }

    const snapshot = getTrainingSession(db, sessionId)
    expect(snapshot?.exercises[0].sets.every((set) => set.completed)).toBe(true)
    expect(snapshot?.exercises[0].status).toBe('completed')
    expect(snapshot?.session.currentExerciseId).toBeNull()
    expect(finishTrainingSession(db, sessionId, new Date('2026-11-21T12:10:00.000Z'))).toBe('completed')
  })

  it('reabre o exercício se uma série for desmarcada depois da conclusão', () => {
    const { db, sessionId, exercise } = sessionWithThreeSets()
    startSessionExercise(db, exercise.id)
    for (const set of exercise.sets) saveSessionSet(db, set.id, { completed: true })

    saveSessionSet(db, exercise.sets[2].id, { completed: false })

    expect(getTrainingSession(db, sessionId)?.exercises[0].status).toBe('in_progress')
  })
})
