import sqlite3InitModule from '@sqlite.org/sqlite-wasm'
import { beforeAll, describe, expect, it } from 'vitest'
import { createModel } from './model-repository'
import { migrateDatabase } from './migrations'
import { clearHistoricalSet, listExerciseLoadHistory, updateHistoricalSet } from './history-repository'
import { createRoutine, createRoutineExercise } from './routine-repository'
import { finishTrainingSession, saveSessionSet, startSessionExercise, startTrainingSession } from './session-repository'
import type { SqliteDatabase, SqliteModule } from './types'

let sqlite3: SqliteModule

beforeAll(async () => {
  sqlite3 = await sqlite3InitModule()
})

function createFinishedSession() {
  const db = new sqlite3.oo1.DB(':memory:') as SqliteDatabase
  migrateDatabase(db)
  const modelId = createModel(db, { name: 'ABC', description: '' })
  const routineId = createRoutine(db, modelId, { name: 'Treino A', focus: '', description: '' })
  createRoutineExercise(db, {
    routineId,
    name: 'Supino',
    muscle: 'Peito',
    setsReps: '1 x 12',
    rest: 60,
    tip: '',
    videoUrl: '',
  })
  const sessionId = startTrainingSession(db, routineId, new Date('2026-11-21T12:00:00.000Z'))
  const sessionExerciseId = Number(db.selectValue('SELECT id FROM session_exercises WHERE session_id = ?', [sessionId]))
  const setId = Number(db.selectValue('SELECT id FROM session_sets WHERE session_exercise_id = ?', [sessionExerciseId]))
  startSessionExercise(db, sessionExerciseId)
  saveSessionSet(db, setId, { load: 20, performedRepetitions: 12, completed: true })
  finishTrainingSession(db, sessionId, new Date('2026-11-21T12:10:00.000Z'))
  return { db, sessionId, setId }
}

describe('exercise load history', () => {
  it('lists load by exercise and edits or clears a set without deleting its session', () => {
    const { db, sessionId, setId } = createFinishedSession()

    expect(listExerciseLoadHistory(db)).toEqual([{
      exerciseName: 'Supino',
      entries: [{
        setId,
        sessionId,
        trainingDate: '2026-11-21',
        startedAt: '2026-11-21T12:00:00.000Z',
        routineName: 'Treino A',
        setPosition: 1,
        load: 20,
        performedRepetitions: 12,
      }],
    }])

    updateHistoricalSet(db, setId, { load: 22.5, performedRepetitions: 10 })
    expect(listExerciseLoadHistory(db)[0].entries[0]).toMatchObject({ load: 22.5, performedRepetitions: 10 })

    clearHistoricalSet(db, setId)
    expect(listExerciseLoadHistory(db)).toEqual([])
    expect(db.selectValue('SELECT status FROM training_sessions WHERE id = ?', [sessionId])).toBe('completed')
  })

  it('does not allow history edits while a session remains in progress', () => {
    const db = new sqlite3.oo1.DB(':memory:') as SqliteDatabase
    migrateDatabase(db)
    const modelId = createModel(db, { name: 'ABC', description: '' })
    const routineId = createRoutine(db, modelId, { name: 'Treino A', focus: '', description: '' })
    createRoutineExercise(db, {
      routineId,
      name: 'Supino',
      muscle: 'Peito',
      setsReps: '1 x 12',
      rest: 60,
      tip: '',
      videoUrl: '',
    })
    const sessionId = startTrainingSession(db, routineId)
    const sessionExerciseId = Number(db.selectValue('SELECT id FROM session_exercises WHERE session_id = ?', [sessionId]))
    const setId = Number(db.selectValue('SELECT id FROM session_sets WHERE session_exercise_id = ?', [sessionExerciseId]))
    startSessionExercise(db, sessionExerciseId)
    saveSessionSet(db, setId, { load: 20 })

    expect(() => updateHistoricalSet(db, setId, { load: 25, performedRepetitions: null })).toThrow('Finalize a sessão')
  })
})
