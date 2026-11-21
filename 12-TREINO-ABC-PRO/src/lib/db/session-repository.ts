import { getActiveModelId } from './routine-repository'
import type { SqliteDatabase } from './types'

export type TrainingSessionRecord = {
  id: number
  modelId: number
  routineId: number | null
  routineName: string
  trainingDate: string
  startedAt: string
  finishedAt: string | null
  status: 'in_progress' | 'completed' | 'partial' | 'stopped'
  currentExerciseId: number | null
  currentSetPosition: number | null
  restStartedAt: string | null
  restDurationSeconds: number | null
  secondsPerSet: number
}

export type SessionSetRecord = {
  id: number
  sessionExerciseId: number
  position: number
  targetRepetitions: string
  load: number | null
  performedRepetitions: number | null
  loggedAt: string | null
  completed: boolean
}

type SessionSetRow = Omit<SessionSetRecord, 'completed'> & { completed: number }

export type SessionExerciseRecord = {
  id: number
  sessionId: number
  sourceExerciseId: number | null
  name: string
  muscle: string
  setsReps: string
  restSeconds: number
  estimatedDurationSeconds: number
  tip: string
  videoUrl: string
  position: number
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  startedAt: string | null
  completedAt: string | null
  sets: SessionSetRecord[]
}

export type TrainingSessionSnapshot = {
  session: TrainingSessionRecord
  exercises: SessionExerciseRecord[]
}

type RoutineExerciseRow = {
  id: number
  name: string
  muscle: string
  setsReps: string
  rest: number
  tip: string
  videoUrl: string
  position: number
}

function localDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isValidDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function requireActiveSession(db: SqliteDatabase, sessionId: number) {
  const status = db.selectValue('SELECT status FROM training_sessions WHERE id = ?', [sessionId])
  if (status !== 'in_progress') throw new Error('A sessão não está em andamento.')
}

function prescribedSetCount(setsReps: string) {
  const match = /^\s*(\d+)\s*[x×]/i.exec(setsReps)
  return Math.max(1, match ? Number(match[1]) : 1)
}

function prescribedRepetitions(setsReps: string) {
  const match = /^\s*\d+\s*[x×]\s*(.+)$/i.exec(setsReps)
  return match?.[1]?.trim() || setsReps.trim()
}

function cardioDuration(setsReps: string) {
  const match = /(\d+(?:[.,]\d+)?)\s*min(?:utos?)?/i.exec(setsReps)
  return match ? Math.round(Number(match[1].replace(',', '.')) * 60) : 0
}

function finalizeSession(db: SqliteDatabase, sessionId: number, finishedAt: string) {
  const exercises = db.selectObjects(
    'SELECT id, status FROM session_exercises WHERE session_id = ? ORDER BY position',
    [sessionId],
  ) as Array<{ id: number; status: SessionExerciseRecord['status'] }>
  if (!exercises.length) throw new Error('A sessão não contém exercícios.')

  const hasStarted = exercises.some((exercise) => exercise.status === 'in_progress' || exercise.status === 'completed')
  const completed = exercises.every((exercise) => exercise.status === 'completed')
  const status: TrainingSessionRecord['status'] = completed ? 'completed' : hasStarted ? 'partial' : 'stopped'

  db.exec({ sql: "UPDATE session_exercises SET status = 'skipped' WHERE session_id = ? AND status = 'not_started'", bind: [sessionId] })
  if (!completed) {
    db.exec({
      sql: `DELETE FROM session_sets
            WHERE session_exercise_id IN (
              SELECT id FROM session_exercises WHERE session_id = ? AND status != 'completed'
            )`,
      bind: [sessionId],
    })
  }
  db.exec({
    sql: `UPDATE training_sessions
          SET status = ?, finished_at = ?, current_exercise_id = NULL, current_set_position = NULL,
              rest_started_at = NULL, rest_duration_seconds = NULL
          WHERE id = ?`,
    bind: [status, finishedAt, sessionId],
  })
  return status
}

export function startTrainingSession(db: SqliteDatabase, routineId: number, now = new Date()): number {
  return db.transaction(() => {
    const routine = db.selectObject(
      `SELECT r.id, r.model_id AS modelId, r.name, m.archived
       FROM routines r JOIN models m ON m.id = r.model_id WHERE r.id = ?`,
      [routineId],
    ) as { id: number; modelId: number; name: string; archived: number } | undefined
    if (!routine || Number(routine.archived) || routine.modelId !== getActiveModelId(db)) {
      throw new Error('Somente treinos do modelo ativo podem ser iniciados.')
    }

    const exercises = db.selectObjects(
      `SELECT id, name, muscle, sets_reps AS setsReps, rest, tip, video_url AS videoUrl, position
       FROM routine_exercises WHERE routine_id = ? ORDER BY position, id`,
      [routineId],
    ) as RoutineExerciseRow[]
    if (!exercises.length) throw new Error('Adicione ao menos um exercício antes de iniciar este treino.')

    const previousSession = db.selectValue("SELECT id FROM training_sessions WHERE status = 'in_progress'")
    if (previousSession !== undefined) finalizeSession(db, Number(previousSession), now.toISOString())

    db.exec({
      sql: `INSERT INTO training_sessions (model_id, routine_id, routine_name, training_date, started_at, status)
            VALUES (?, ?, ?, ?, ?, 'in_progress')`,
      bind: [routine.modelId, routine.id, routine.name, localDate(now), now.toISOString()],
    })
    const sessionId = Number(db.selectValue('SELECT last_insert_rowid()'))

    for (const exercise of exercises) {
      const cardioSeconds = cardioDuration(exercise.setsReps)
      const count = prescribedSetCount(exercise.setsReps)
      db.exec({
        sql: `INSERT INTO session_exercises
              (session_id, source_exercise_id, name, muscle, sets_reps, rest_seconds,
               estimated_duration_seconds, tip, video_url, position, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'not_started')`,
        bind: [
          sessionId,
          exercise.id,
          exercise.name,
          exercise.muscle,
          exercise.setsReps,
          exercise.rest,
          cardioSeconds,
          exercise.tip,
          exercise.videoUrl,
          exercise.position,
        ],
      })
      const sessionExerciseId = Number(db.selectValue('SELECT last_insert_rowid()'))
      const targetRepetitions = prescribedRepetitions(exercise.setsReps)
      for (let position = 1; position <= count; position++) {
        db.exec({
          sql: `INSERT INTO session_sets (session_exercise_id, position, target_repetitions)
                VALUES (?, ?, ?)`,
          bind: [sessionExerciseId, position, targetRepetitions],
        })
      }
    }
    return sessionId
  })
}

export function getTrainingSession(db: SqliteDatabase, sessionId: number): TrainingSessionSnapshot | undefined {
  const session = db.selectObject(
    `SELECT id, model_id AS modelId, routine_id AS routineId, routine_name AS routineName, training_date AS trainingDate,
            started_at AS startedAt, finished_at AS finishedAt, status,
            current_exercise_id AS currentExerciseId, current_set_position AS currentSetPosition,
            rest_started_at AS restStartedAt, rest_duration_seconds AS restDurationSeconds,
            seconds_per_set AS secondsPerSet
     FROM training_sessions WHERE id = ?`,
    [sessionId],
  ) as TrainingSessionRecord | undefined
  if (!session) return undefined

  const exercises = db.selectObjects(
    `SELECT id, session_id AS sessionId, source_exercise_id AS sourceExerciseId, name, muscle,
            sets_reps AS setsReps, rest_seconds AS restSeconds,
            estimated_duration_seconds AS estimatedDurationSeconds, tip, video_url AS videoUrl,
            position, status, started_at AS startedAt, completed_at AS completedAt
     FROM session_exercises WHERE session_id = ? ORDER BY position, id`,
    [sessionId],
  ) as Omit<SessionExerciseRecord, 'sets'>[]

  return {
    session,
    exercises: exercises.map((exercise) => ({
      ...exercise,
      sets: (db.selectObjects(
        `SELECT id, session_exercise_id AS sessionExerciseId, position,
                target_repetitions AS targetRepetitions, load,
                performed_repetitions AS performedRepetitions, logged_at AS loggedAt, completed
         FROM session_sets WHERE session_exercise_id = ? ORDER BY position`,
        [exercise.id],
      ) as SessionSetRow[]).map((set) => ({ ...set, completed: Boolean(set.completed) })),
    })),
  }
}

export function getActiveTrainingSession(db: SqliteDatabase): TrainingSessionSnapshot | undefined {
  const id = db.selectValue("SELECT id FROM training_sessions WHERE status = 'in_progress' LIMIT 1")
  return id === undefined ? undefined : getTrainingSession(db, Number(id))
}

export function listTrainingSessions(db: SqliteDatabase, startDate: string, endDate: string): TrainingSessionSnapshot[] {
  const sessions = db.selectObjects(
    `SELECT id FROM training_sessions
     WHERE training_date >= ? AND training_date < ?
     ORDER BY training_date DESC, started_at DESC, id DESC`,
    [startDate, endDate],
  ) as Array<{ id: number }>
  return sessions.flatMap(({ id }) => {
    const snapshot = getTrainingSession(db, id)
    return snapshot ? [snapshot] : []
  })
}

export function getSuggestedRoutineId(db: SqliteDatabase, modelId: number): number | undefined {
  const routines = db.selectObjects(
    'SELECT id FROM routines WHERE model_id = ? ORDER BY position, id',
    [modelId],
  ) as Array<{ id: number }>
  if (!routines.length) return undefined

  const lastCompletedRoutineId = db.selectValue(
    `SELECT routine_id FROM training_sessions
     WHERE model_id = ? AND status = 'completed' AND routine_id IS NOT NULL
    ORDER BY finished_at DESC, id DESC LIMIT 1`,
    [modelId],
  )
  const previousIndex = routines.findIndex(({ id }) => id === Number(lastCompletedRoutineId))
  return routines[(previousIndex + 1) % routines.length].id
}

export function updateTrainingDate(db: SqliteDatabase, sessionId: number, trainingDate: string) {
  if (!isValidDateOnly(trainingDate)) throw new Error('Informe uma data válida para o treino.')
  if (db.selectValue('SELECT id FROM training_sessions WHERE id = ?', [sessionId]) === undefined) {
    throw new Error('A sessão não existe mais.')
  }
  db.exec({ sql: 'UPDATE training_sessions SET training_date = ? WHERE id = ?', bind: [trainingDate, sessionId] })
}

export function startSessionExercise(db: SqliteDatabase, sessionExerciseId: number, now = new Date()) {
  db.transaction(() => {
    const exercise = db.selectObject(
      `SELECT se.session_id AS sessionId, se.status AS exerciseStatus, ts.status AS sessionStatus
       FROM session_exercises se JOIN training_sessions ts ON ts.id = se.session_id
       WHERE se.id = ?`,
      [sessionExerciseId],
    ) as { sessionId: number; exerciseStatus: SessionExerciseRecord['status']; sessionStatus: TrainingSessionRecord['status'] } | undefined
    if (!exercise || exercise.sessionStatus !== 'in_progress') throw new Error('O exercício não pertence a uma sessão em andamento.')
    if (exercise.exerciseStatus === 'completed') throw new Error('O exercício já está marcado como concluído.')
    db.exec({
      sql: `UPDATE session_exercises
            SET status = 'in_progress', started_at = COALESCE(started_at, ?), completed_at = NULL
            WHERE id = ? AND status != 'completed'`,
      bind: [now.toISOString(), sessionExerciseId],
    })
    const firstPendingSet = Number(db.selectValue(
      'SELECT position FROM session_sets WHERE session_exercise_id = ? AND completed = 0 ORDER BY position LIMIT 1',
      [sessionExerciseId],
    ) ?? 1)
    db.exec({
      sql: 'UPDATE training_sessions SET current_exercise_id = ?, current_set_position = ? WHERE id = ?',
      bind: [sessionExerciseId, firstPendingSet, exercise.sessionId],
    })
  })
}

export function setSessionExerciseCompleted(db: SqliteDatabase, sessionExerciseId: number, completed: boolean, now = new Date()) {
  db.transaction(() => {
    const exercise = db.selectObject(
      `SELECT se.session_id AS sessionId, se.started_at AS startedAt, ts.status AS sessionStatus
       FROM session_exercises se JOIN training_sessions ts ON ts.id = se.session_id
       WHERE se.id = ?`,
      [sessionExerciseId],
    ) as { sessionId: number; startedAt: string | null; sessionStatus: TrainingSessionRecord['status'] } | undefined
    if (!exercise || exercise.sessionStatus !== 'in_progress') throw new Error('O exercício não pertence a uma sessão em andamento.')
    const status = completed ? 'completed' : exercise.startedAt ? 'in_progress' : 'not_started'
    db.exec({
      sql: 'UPDATE session_exercises SET status = ?, completed_at = ? WHERE id = ?',
      bind: [status, completed ? now.toISOString() : null, sessionExerciseId],
    })
    if (completed) {
      db.exec({
        sql: 'UPDATE training_sessions SET current_exercise_id = NULL, current_set_position = NULL WHERE id = ? AND current_exercise_id = ?',
        bind: [exercise.sessionId, sessionExerciseId],
      })
    }
  })
}

export function saveSessionSet(
  db: SqliteDatabase,
  sessionSetId: number,
  values: { load?: number | null; performedRepetitions?: number | null; completed?: boolean },
  now = new Date(),
) {
  if (values.load != null && (!Number.isFinite(values.load) || values.load < 0)) throw new Error('A carga deve ser um número igual ou maior que zero.')
  if (values.performedRepetitions != null && (!Number.isInteger(values.performedRepetitions) || values.performedRepetitions < 1)) {
    throw new Error('As repetições realizadas devem ser um número inteiro positivo.')
  }
  db.transaction(() => {
    const set = db.selectObject(
      `SELECT ss.session_exercise_id AS sessionExerciseId, ss.position, se.status AS exerciseStatus,
              se.session_id AS sessionId, ts.status AS sessionStatus
       FROM session_sets ss
       JOIN session_exercises se ON se.id = ss.session_exercise_id
       JOIN training_sessions ts ON ts.id = se.session_id
       WHERE ss.id = ?`,
      [sessionSetId],
    ) as { sessionExerciseId: number; position: number; exerciseStatus: SessionExerciseRecord['status']; sessionId: number; sessionStatus: TrainingSessionRecord['status'] } | undefined
    if (!set || set.sessionStatus !== 'in_progress') throw new Error('A série não pertence a uma sessão em andamento.')
    if (set.exerciseStatus === 'not_started' || set.exerciseStatus === 'skipped') throw new Error('Inicie o exercício antes de registrar as séries.')
    db.exec({
      sql: `UPDATE session_sets
            SET load = CASE WHEN ? THEN ? ELSE load END,
                performed_repetitions = CASE WHEN ? THEN ? ELSE performed_repetitions END,
                completed = COALESCE(?, completed), logged_at = ?
            WHERE id = ?`,
      bind: [
        Number(values.load !== undefined),
        values.load ?? null,
        Number(values.performedRepetitions !== undefined),
        values.performedRepetitions ?? null,
        values.completed === undefined ? null : Number(values.completed),
        now.toISOString(),
        sessionSetId,
      ],
    })
    const remainingSets = Number(db.selectValue(
      'SELECT COUNT(*) FROM session_sets WHERE session_exercise_id = ? AND completed = 0',
      [set.sessionExerciseId],
    ))
    const exerciseCompleted = values.completed === true && remainingSets === 0
    if (exerciseCompleted) {
      db.exec({
        sql: "UPDATE session_exercises SET status = 'completed', completed_at = ? WHERE id = ?",
        bind: [now.toISOString(), set.sessionExerciseId],
      })
    } else if (set.exerciseStatus === 'completed' && values.completed === false) {
      db.exec({
        sql: "UPDATE session_exercises SET status = 'in_progress', completed_at = NULL WHERE id = ?",
        bind: [set.sessionExerciseId],
      })
    }

    const nextPosition = values.completed
      ? Number(db.selectValue(
        `SELECT position FROM session_sets
         WHERE session_exercise_id = ? AND position > ? AND completed = 0
         ORDER BY position LIMIT 1`,
        [set.sessionExerciseId, set.position],
      ) ?? set.position)
      : set.position
    if (exerciseCompleted) {
      db.exec({
        sql: `UPDATE training_sessions
              SET current_exercise_id = NULL, current_set_position = NULL
              WHERE id = ? AND current_exercise_id = ?`,
        bind: [set.sessionId, set.sessionExerciseId],
      })
    } else {
      db.exec({
        sql: 'UPDATE training_sessions SET current_exercise_id = ?, current_set_position = ? WHERE id = ?',
        bind: [set.sessionExerciseId, nextPosition, set.sessionId],
      })
    }
  })
}

export function updateSessionSecondsPerSet(db: SqliteDatabase, sessionId: number, seconds: number) {
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 600) throw new Error('A estimativa por série deve ficar entre 1 e 600 segundos.')
  requireActiveSession(db, sessionId)
  db.exec({
    sql: 'UPDATE training_sessions SET seconds_per_set = ? WHERE id = ? AND status = ?',
    bind: [seconds, sessionId, 'in_progress'],
  })
}

export function updateSessionExerciseDuration(db: SqliteDatabase, sessionExerciseId: number, seconds: number) {
  if (!Number.isInteger(seconds) || seconds < 0 || seconds > 86400) throw new Error('A estimativa deve ficar entre zero e 24 horas.')
  if (db.selectValue(
    `SELECT id FROM session_exercises
     WHERE id = ? AND session_id IN (SELECT id FROM training_sessions WHERE status = 'in_progress')`,
    [sessionExerciseId],
  ) === undefined) throw new Error('O exercício não pertence a uma sessão em andamento.')
  db.exec({
    sql: `UPDATE session_exercises SET estimated_duration_seconds = ?
          WHERE id = ? AND session_id IN (SELECT id FROM training_sessions WHERE status = 'in_progress')`,
    bind: [seconds, sessionExerciseId],
  })
}

export function startRestTimer(db: SqliteDatabase, sessionId: number, durationSeconds: number, now = new Date()) {
  if (!Number.isInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > 3600) throw new Error('O descanso deve ficar entre 1 e 3600 segundos.')
  requireActiveSession(db, sessionId)
  db.exec({
    sql: `UPDATE training_sessions
          SET rest_started_at = ?, rest_duration_seconds = ?
          WHERE id = ? AND status = ?`,
    bind: [now.toISOString(), durationSeconds, sessionId, 'in_progress'],
  })
}

export function clearRestTimer(db: SqliteDatabase, sessionId: number) {
  requireActiveSession(db, sessionId)
  db.exec({
    sql: 'UPDATE training_sessions SET rest_started_at = NULL, rest_duration_seconds = NULL WHERE id = ? AND status = ?',
    bind: [sessionId, 'in_progress'],
  })
}

export function finishTrainingSession(db: SqliteDatabase, sessionId: number, now = new Date()) {
  return db.transaction(() => {
    const status = db.selectValue('SELECT status FROM training_sessions WHERE id = ?', [sessionId])
    if (status !== 'in_progress') throw new Error('A sessão não está em andamento.')
    return finalizeSession(db, sessionId, now.toISOString())
  })
}

export function assertModelCanBeArchived(db: SqliteDatabase, modelId: number) {
  const hasActiveSession = db.selectValue(
    `SELECT id FROM training_sessions
     WHERE model_id = ? AND status = 'in_progress' LIMIT 1`,
    [modelId],
  ) !== undefined
  if (hasActiveSession) throw new Error('Não é possível arquivar o modelo enquanto houver um treino em andamento.')
}
