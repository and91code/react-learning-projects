import sqlite3InitModule from '@sqlite.org/sqlite-wasm'
import type { Exercise, ExerciseInput, Workout, WorkoutInput } from '../types'
import { exerciseCatalog } from '../domain/training/exercise-catalog'
import { migrateDatabase } from './db/migrations'
import {
  createModel,
  listModels as listModelRecords,
  reorderModels,
  setModelActive,
  setModelArchived,
  updateModel,
  type WorkoutModel,
  type WorkoutModelInput,
} from './db/model-repository'
import {
  createRoutine,
  createRoutineExercise,
  deleteRoutine,
  deleteRoutineExercise,
  getActiveModelId,
  listRoutineExercises,
  listRoutines,
  reorderRoutines,
  resetRoutineProgress,
  setRoutineExerciseCompleted,
  updateRoutine,
  updateRoutineExercise,
  type RoutineExerciseInput,
  type RoutineExerciseRecord,
  type RoutineRecord,
} from './db/routine-repository'
import {
  assertModelCanBeArchived,
  clearRestTimer,
  finishTrainingSession,
  getSuggestedRoutineId as getSuggestedRoutineRecordId,
  getActiveTrainingSession,
  listTrainingSessions as listSessionRecords,
  saveSessionSet,
  setSessionExerciseCompleted,
  startRestTimer,
  startSessionExercise,
  startTrainingSession,
  updateSessionExerciseDuration,
  updateSessionSecondsPerSet,
  updateTrainingDate,
} from './db/session-repository'
import {
  clearHistoricalSet as clearHistoricalSetRecord,
  listExerciseLoadHistory as listExerciseLoadHistoryRecords,
  updateHistoricalSet as updateHistoricalSetRecord,
} from './db/history-repository'
import {
  getLocalProfile as getLocalProfileRecord,
  saveLocalProfile as saveLocalProfileRecord,
  type LocalProfile,
} from './db/profile-repository'
import type { SqliteDatabase, SqliteModule } from './db/types'


const DB_KEY = 'treino-abc-pro.sqlite'
let databasePromise: Promise<SqliteDatabase> | undefined
let sqlitePromise: Promise<SqliteModule> | undefined
let persistenceQueue = Promise.resolve()

function getSqlite() {
  sqlitePromise ??= sqlite3InitModule()
  return sqlitePromise
}

const initialWorkouts: WorkoutInput[] = [
  { name: 'Treino A', focus: 'Empurrar', description: 'Peito, ombros, tríceps e core anterior.' },
  { name: 'Treino B', focus: 'Puxar', description: 'Costas, posterior de ombros, bíceps e oblíquos.' },
  { name: 'Treino C', focus: 'Pernas & Core', description: 'Quadríceps, posterior, glúteos, panturrilha e abdômen.' },
]

const initialExercises: (ExerciseInput & { workoutId: number })[] = exerciseCatalog.map((exercise) => ({
  workoutId: { A: 1, B: 2, C: 3 }[exercise.routine],
  name: exercise.name,
  muscle: exercise.muscle,
  setsReps: exercise.setsReps,
  rest: exercise.rest,
  tip: exercise.tip,
}))

async function openDatabase(): Promise<SqliteDatabase> {
  const sqlite3 = await getSqlite()
  const db = new sqlite3.oo1.DB(':memory:')
  const saved = await new Promise<ArrayBuffer | undefined>((resolve, reject) => {
    const request = indexedDB.open(DB_KEY, 1)
    request.onupgradeneeded = () => request.result.createObjectStore('database')
    request.onsuccess = () => {
      const read = request.result.transaction('database', 'readonly')!.objectStore('database').get('main')
      read.onerror = () => {
        request.result.close()
        reject(read.error)
      }
      read.onsuccess = () => {
        const result = read.result as ArrayBuffer | undefined
        request.result.close()
        resolve(result)
      }
    }
    request.onblocked = () => reject(new Error('O banco local está ocupado por outra aba. Feche outras abas do Treino ABC Pro e tente novamente.'))
    request.onerror = () => reject(request.error)
  })

  if (saved) {
    const bytes = new Uint8Array(saved)
    const pointer = sqlite3.wasm.allocFromTypedArray(bytes)
    const result = sqlite3.capi.sqlite3_deserialize(
      db,
      'main',
      pointer,
      bytes.byteLength,
      bytes.byteLength,
      sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE,
    )
    if (result !== sqlite3.capi.SQLITE_OK) throw new Error(`Falha ao restaurar banco SQLite (código ${result}).`)
  }
  db.exec('PRAGMA foreign_keys = ON')
  const migrated = migrateDatabase(db)
  const seeded = seedInitialModel(db)
  if (!saved || migrated || seeded) await persist(db)
  return db
}

/** Cria o modelo inicial com as rotinas A/B/C somente quando ainda não há nenhum modelo. */
function seedInitialModel(db: SqliteDatabase) {
  if (Number(db.selectValue('SELECT COUNT(*) FROM models')) > 0) return false

  const modelId = createModel(db, { name: 'Treino ABC Pro', description: 'Modelo inicial com os treinos A, B e C.' })
  const routineIds: number[] = []
  for (const [index, workout] of initialWorkouts.entries()) {
    db.exec({
      sql: 'INSERT INTO routines (model_id, name, focus, description, position) VALUES (?, ?, ?, ?, ?)',
      bind: [modelId, workout.name, workout.focus, workout.description, index + 1],
    })
    routineIds.push(Number(db.selectValue('SELECT last_insert_rowid()')))
  }

  const positions = new Map<number, number>()
  for (const exercise of initialExercises) {
    const routineId = routineIds[exercise.workoutId - 1]
    const position = (positions.get(routineId) ?? 0) + 1
    positions.set(routineId, position)
    db.exec({
      sql: 'INSERT INTO routine_exercises (routine_id, name, muscle, sets_reps, rest, tip, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
      bind: [routineId, exercise.name, exercise.muscle, exercise.setsReps, exercise.rest, exercise.tip, position],
    })
  }
  return true
}

async function writeDatabase(db: SqliteDatabase) {
  const sqlite3 = await getSqlite()
  const data = sqlite3.capi.sqlite3_js_db_export(db)
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(DB_KEY, 1)
    request.onsuccess = () => {
      const transaction = request.result.transaction('database', 'readwrite')
      transaction.objectStore('database').put(data, 'main')
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error ?? new Error('A gravação do banco local foi cancelada.'))
      transaction.oncomplete = () => {
        request.result.close()
        resolve()
      }
    }
    request.onblocked = () => reject(new Error('O banco local está ocupado por outra aba. Feche outras abas do Treino ABC Pro e tente novamente.'))
    request.onerror = () => reject(request.error)
  })
}

async function persist(db: SqliteDatabase) {
  const write = persistenceQueue.then(() => writeDatabase(db))
  persistenceQueue = write.catch(() => undefined)
  await write
}

async function getDb() {
  databasePromise ??= openDatabase().catch((error: unknown) => {
    databasePromise = undefined
    throw error
  })
  return databasePromise
}

export function retryDatabaseInitialization() {
  databasePromise = undefined
}

function toWorkout(routine: RoutineRecord): Workout {
  return { id: routine.id, name: routine.name, focus: routine.focus, description: routine.description }
}

function toExercise(exercise: RoutineExerciseRecord): Exercise {
  return {
    id: exercise.id,
    workoutId: exercise.routineId,
    name: exercise.name,
    muscle: exercise.muscle,
    setsReps: exercise.setsReps,
    rest: exercise.rest,
    tip: exercise.tip,
    videoUrl: exercise.videoUrl || undefined,
    completed: exercise.completed,
  }
}

function toExerciseInput(input: ExerciseInput): RoutineExerciseInput {
  return {
    routineId: input.workoutId,
    name: input.name,
    muscle: input.muscle,
    setsReps: input.setsReps,
    rest: input.rest,
    tip: input.tip,
    videoUrl: input.videoUrl ?? '',
  }
}

export async function listWorkouts(): Promise<Workout[]> {
  const db = await getDb()
  return listRoutines(db, getActiveModelId(db)).map(toWorkout)
}

export async function listExercises(workoutId?: number): Promise<Exercise[]> {
  const db = await getDb()
  if (workoutId !== undefined) return listRoutineExercises(db, workoutId).map(toExercise)
  const routines = listRoutines(db, getActiveModelId(db))
  return routines.flatMap((routine) => listRoutineExercises(db, routine.id).map(toExercise))
}

export async function listModelExercises(modelId: number): Promise<Exercise[]> {
  const db = await getDb()
  return listRoutines(db, modelId).flatMap((routine) => listRoutineExercises(db, routine.id).map(toExercise))
}

export async function saveWorkout(input: WorkoutInput, id?: number) {
  const db = await getDb()
  if (id) updateRoutine(db, id, input)
  else createRoutine(db, getActiveModelId(db), input)
  await persist(db)
}

export async function removeWorkout(id: number) {
  const db = await getDb()
  deleteRoutine(db, id)
  await persist(db)
}

export async function saveExercise(input: ExerciseInput, id?: number) {
  const db = await getDb()
  if (id) updateRoutineExercise(db, id, toExerciseInput(input))
  else createRoutineExercise(db, toExerciseInput(input))
  await persist(db)
}

export async function removeExercise(id: number) {
  const db = await getDb()
  deleteRoutineExercise(db, id)
  await persist(db)
}

export async function setExerciseCompleted(id: number, completed: boolean) {
  const db = await getDb()
  setRoutineExerciseCompleted(db, id, completed)
  await persist(db)
}

export async function resetWorkoutProgress(workoutId: number) {
  const db = await getDb()
  resetRoutineProgress(db, workoutId)
  await persist(db)
}

export async function listWorkoutModels(): Promise<WorkoutModel[]> {
  return listModelRecords(await getDb())
}

export async function saveWorkoutModel(input: WorkoutModelInput, id?: number) {
  const db = await getDb()
  if (id) updateModel(db, id, input)
  else createModel(db, input)
  await persist(db)
}

export async function archiveWorkoutModel(id: number, archived: boolean) {
  const db = await getDb()
  if (archived) assertModelCanBeArchived(db, id)
  setModelArchived(db, id, archived)
  await persist(db)
}

export async function activateWorkoutModel(id: number) {
  const db = await getDb()
  setModelActive(db, id)
  await persist(db)
}

export async function reorderWorkoutModels(orderedIds: number[]) {
  const db = await getDb()
  reorderModels(db, orderedIds)
  await persist(db)
}

export async function listModelRoutines(modelId: number): Promise<Workout[]> {
  return listRoutines(await getDb(), modelId).map(toWorkout)
}

export async function reorderModelRoutines(modelId: number, orderedIds: number[]) {
  const db = await getDb()
  reorderRoutines(db, modelId, orderedIds)
  await persist(db)
}

export async function saveModelRoutine(modelId: number, input: WorkoutInput, id?: number) {
  const db = await getDb()
  if (id) updateRoutine(db, id, input)
  else createRoutine(db, modelId, input)
  await persist(db)
}

export async function beginWorkoutSession(routineId: number) {
  const db = await getDb()
  const sessionId = startTrainingSession(db, routineId)
  await persist(db)
  return sessionId
}

export async function loadActiveTrainingSession() {
  return getActiveTrainingSession(await getDb())
}

export async function listTrainingSessions(startDate: string, endDate: string) {
  return listSessionRecords(await getDb(), startDate, endDate)
}

export async function getSuggestedRoutineId(modelId: number) {
  return getSuggestedRoutineRecordId(await getDb(), modelId)
}

export async function setTrainingSessionDate(sessionId: number, trainingDate: string) {
  const db = await getDb()
  updateTrainingDate(db, sessionId, trainingDate)
  await persist(db)
}

export async function startTrainingExercise(sessionExerciseId: number) {
  const db = await getDb()
  startSessionExercise(db, sessionExerciseId)
  await persist(db)
}

export async function setTrainingExerciseCompleted(sessionExerciseId: number, completed: boolean) {
  const db = await getDb()
  setSessionExerciseCompleted(db, sessionExerciseId, completed)
  await persist(db)
}

export async function saveTrainingSet(
  sessionSetId: number,
  values: { load?: number | null; performedRepetitions?: number | null; completed?: boolean },
) {
  const db = await getDb()
  saveSessionSet(db, sessionSetId, values)
  await persist(db)
}

export async function setTrainingSessionEstimate(sessionId: number, secondsPerSet: number) {
  const db = await getDb()
  updateSessionSecondsPerSet(db, sessionId, secondsPerSet)
  await persist(db)
}

export async function setTrainingExerciseEstimate(sessionExerciseId: number, seconds: number) {
  const db = await getDb()
  updateSessionExerciseDuration(db, sessionExerciseId, seconds)
  await persist(db)
}

export async function startTrainingRest(sessionId: number, durationSeconds: number) {
  const db = await getDb()
  startRestTimer(db, sessionId, durationSeconds)
  await persist(db)
}

export async function stopTrainingRest(sessionId: number) {
  const db = await getDb()
  clearRestTimer(db, sessionId)
  await persist(db)
}

export async function completeTrainingSession(sessionId: number) {
  const db = await getDb()
  const status = finishTrainingSession(db, sessionId)
  await persist(db)
  return status
}

export async function loadLocalProfile() {
  return getLocalProfileRecord(await getDb())
}

export async function saveLocalProfile(profile: LocalProfile) {
  const db = await getDb()
  saveLocalProfileRecord(db, profile)
  await persist(db)
}

export async function listExerciseLoadHistory() {
  return listExerciseLoadHistoryRecords(await getDb())
}

export async function updateHistoricalSet(
  setId: number,
  values: { load: number | null; performedRepetitions: number | null },
) {
  const db = await getDb()
  updateHistoricalSetRecord(db, setId, values)
  await persist(db)
}

export async function clearHistoricalSet(setId: number) {
  const db = await getDb()
  clearHistoricalSetRecord(db, setId)
  await persist(db)
}
