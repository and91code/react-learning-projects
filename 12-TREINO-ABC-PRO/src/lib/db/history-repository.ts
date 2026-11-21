import type { SqliteDatabase } from './types'

export type ExerciseLoadHistoryEntry = {
  setId: number
  sessionId: number
  trainingDate: string
  startedAt: string
  routineName: string
  setPosition: number
  load: number | null
  performedRepetitions: number | null
}

export type ExerciseLoadHistory = {
  exerciseName: string
  entries: ExerciseLoadHistoryEntry[]
}

type ExerciseLoadHistoryRow = ExerciseLoadHistoryEntry & { exerciseName: string }

function assertSetValues(load: number | null, repetitions: number | null) {
  if (load !== null && (!Number.isFinite(load) || load < 0)) throw new Error('A carga deve ser um número igual ou maior que zero.')
  if (repetitions !== null && (!Number.isInteger(repetitions) || repetitions < 1)) {
    throw new Error('As repetições realizadas devem ser um número inteiro positivo.')
  }
}

function requireFinishedSet(db: SqliteDatabase, setId: number) {
  const row = db.selectObject(
    `SELECT ss.id, ts.status
     FROM session_sets ss
     JOIN session_exercises se ON se.id = ss.session_exercise_id
     JOIN training_sessions ts ON ts.id = se.session_id
     WHERE ss.id = ?`,
    [setId],
  ) as { id: number; status: string } | undefined
  if (!row) throw new Error('O registro de série não existe.')
  if (row.status === 'in_progress') throw new Error('Finalize a sessão antes de editar o histórico.')
}

export function listExerciseLoadHistory(db: SqliteDatabase): ExerciseLoadHistory[] {
  const rows = db.selectObjects(
    `SELECT ss.id AS setId, ts.id AS sessionId, ts.training_date AS trainingDate,
            ts.started_at AS startedAt, ts.routine_name AS routineName,
            se.name AS exerciseName, ss.position AS setPosition,
            ss.load, ss.performed_repetitions AS performedRepetitions
     FROM session_sets ss
     JOIN session_exercises se ON se.id = ss.session_exercise_id
     JOIN training_sessions ts ON ts.id = se.session_id
     WHERE ts.status != 'in_progress'
       AND (ss.load IS NOT NULL OR ss.performed_repetitions IS NOT NULL)
     ORDER BY ts.training_date DESC, ts.started_at DESC, ss.position`,
  ) as ExerciseLoadHistoryRow[]
  const grouped = new Map<string, ExerciseLoadHistory>()
  for (const row of rows) {
    const { exerciseName, ...entry } = row
    const history = grouped.get(exerciseName) ?? { exerciseName, entries: [] }
    history.entries.push(entry)
    grouped.set(exerciseName, history)
  }
  return [...grouped.values()]
}

export function updateHistoricalSet(
  db: SqliteDatabase,
  setId: number,
  values: { load: number | null; performedRepetitions: number | null },
  now = new Date(),
) {
  assertSetValues(values.load, values.performedRepetitions)
  requireFinishedSet(db, setId)
  db.exec({
    sql: `UPDATE session_sets SET load = ?, performed_repetitions = ?, logged_at = ?
          WHERE id = ?`,
    bind: [values.load, values.performedRepetitions, now.toISOString(), setId],
  })
}

export function clearHistoricalSet(db: SqliteDatabase, setId: number) {
  requireFinishedSet(db, setId)
  db.exec({
    sql: 'UPDATE session_sets SET load = NULL, performed_repetitions = NULL, logged_at = NULL WHERE id = ?',
    bind: [setId],
  })
}
