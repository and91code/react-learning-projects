import type { SqliteDatabase } from './types'
import { reorderItems } from './model-repository'

export type RoutineRecord = {
  id: number
  name: string
  focus: string
  description: string
  position: number
}

export type RoutineExerciseRecord = {
  id: number
  routineId: number
  name: string
  muscle: string
  setsReps: string
  rest: number
  tip: string
  videoUrl: string
  position: number
  completed: boolean
}

export type RoutineInput = Pick<RoutineRecord, 'name' | 'focus' | 'description'>
export type RoutineExerciseInput = Omit<RoutineExerciseRecord, 'id' | 'position' | 'completed'>

type RoutineExerciseRow = Omit<RoutineExerciseRecord, 'completed'> & { completed: number }

export function getActiveModelId(db: SqliteDatabase): number {
  return Number(db.selectValue('SELECT id FROM models WHERE archived = 0 AND active = 1 LIMIT 1') ?? 0)
}

export function listRoutines(db: SqliteDatabase, modelId: number): RoutineRecord[] {
  return db.selectObjects(
    'SELECT id, name, focus, description, position FROM routines WHERE model_id = ? ORDER BY position, id',
    [modelId],
  ) as RoutineRecord[]
}

export function createRoutine(db: SqliteDatabase, modelId: number, input: RoutineInput): number {
  db.exec({
    sql: `INSERT INTO routines (model_id, name, focus, description, position)
          VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(position), 0) + 1 FROM routines WHERE model_id = ?))`,
    bind: [modelId, input.name, input.focus, input.description, modelId],
  })
  return Number(db.selectValue('SELECT last_insert_rowid()'))
}

export function updateRoutine(db: SqliteDatabase, id: number, input: RoutineInput) {
  db.exec({ sql: 'UPDATE routines SET name = ?, focus = ?, description = ? WHERE id = ?', bind: [input.name, input.focus, input.description, id] })
}

export function deleteRoutine(db: SqliteDatabase, id: number) {
  db.transaction(() => {
    db.exec({ sql: 'DELETE FROM routine_exercises WHERE routine_id = ?', bind: [id] })
    db.exec({ sql: 'DELETE FROM routines WHERE id = ?', bind: [id] })
  })
}

export function reorderRoutines(db: SqliteDatabase, modelId: number, orderedIds: number[]) {
  reorderItems(db, 'routines', orderedIds, 'WHERE model_id = ?', [modelId])
}

export function listRoutineExercises(db: SqliteDatabase, routineId?: number): RoutineExerciseRecord[] {
  const rows = db.selectObjects(
    `SELECT id, routine_id AS routineId, name, muscle, sets_reps AS setsReps, rest, tip, video_url AS videoUrl, position, completed
     FROM routine_exercises ${routineId ? 'WHERE routine_id = ?' : ''} ORDER BY position, id`,
    routineId ? [routineId] : [],
  ) as RoutineExerciseRow[]
  return rows.map((row) => ({ ...row, completed: Boolean(row.completed) }))
}

export function createRoutineExercise(db: SqliteDatabase, input: RoutineExerciseInput): number {
  db.exec({
    sql: `INSERT INTO routine_exercises (routine_id, name, muscle, sets_reps, rest, tip, video_url, position)
          VALUES (?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position), 0) + 1 FROM routine_exercises WHERE routine_id = ?))`,
    bind: [input.routineId, input.name, input.muscle, input.setsReps, input.rest, input.tip, input.videoUrl, input.routineId],
  })
  return Number(db.selectValue('SELECT last_insert_rowid()'))
}

export function updateRoutineExercise(db: SqliteDatabase, id: number, input: RoutineExerciseInput) {
  db.exec({
    sql: 'UPDATE routine_exercises SET routine_id = ?, name = ?, muscle = ?, sets_reps = ?, rest = ?, tip = ?, video_url = ? WHERE id = ?',
    bind: [input.routineId, input.name, input.muscle, input.setsReps, input.rest, input.tip, input.videoUrl, id],
  })
}

export function deleteRoutineExercise(db: SqliteDatabase, id: number) {
  db.exec({ sql: 'DELETE FROM routine_exercises WHERE id = ?', bind: [id] })
}

/** Conclusão manual do exercício; não é derivada das séries registradas. */
export function setRoutineExerciseCompleted(db: SqliteDatabase, id: number, completed: boolean) {
  db.exec({ sql: 'UPDATE routine_exercises SET completed = ? WHERE id = ?', bind: [Number(completed), id] })
}

export function resetRoutineProgress(db: SqliteDatabase, routineId: number) {
  db.exec({ sql: 'UPDATE routine_exercises SET completed = 0 WHERE routine_id = ?', bind: [routineId] })
}
