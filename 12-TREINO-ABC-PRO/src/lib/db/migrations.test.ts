import sqlite3InitModule from '@sqlite.org/sqlite-wasm'
import { beforeAll, describe, expect, it } from 'vitest'
import { migrateDatabase } from './migrations'
import { createRoutine, createRoutineExercise, deleteRoutine, deleteRoutineExercise, getActiveModelId, listRoutineExercises, listRoutines, reorderRoutines, resetRoutineProgress, setRoutineExerciseCompleted, updateRoutine, updateRoutineExercise } from './routine-repository'
import { MAX_MODELS, ModelLimitError, createModel, listModels, reorderItems, setModelActive, setModelArchived } from './model-repository'
import type { SqliteDatabase, SqliteModule } from './types'

let sqlite3: SqliteModule

beforeAll(async () => {
  sqlite3 = await sqlite3InitModule()
})

function memoryDb(): SqliteDatabase {
  return new sqlite3.oo1.DB(':memory:')
}

describe('migrateDatabase', () => {
  it('converte o schema legado preservando ids, ordem e progresso', () => {
    const db = memoryDb()
    db.exec(`
      CREATE TABLE workouts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, focus TEXT NOT NULL, description TEXT NOT NULL);
      CREATE TABLE exercises (id INTEGER PRIMARY KEY AUTOINCREMENT, workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE, name TEXT NOT NULL, muscle TEXT NOT NULL, sets_reps TEXT NOT NULL, rest INTEGER NOT NULL DEFAULT 60, tip TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0);
      INSERT INTO workouts (name, focus, description) VALUES ('Treino A', 'Empurrar', 'Peito'), ('Treino B', 'Puxar', 'Costas');
      INSERT INTO exercises (workout_id, name, muscle, sets_reps, rest, tip, completed) VALUES (1, 'Supino', 'Peito', '3 x 12', 60, 'Dica', 1), (2, 'Remada', 'Costas', '3 x 12', 45, 'Dica', 0), (1, 'Crucifixo', 'Peito', '3 x 15', 45, 'Dica', 0);
    `)

    expect(migrateDatabase(db)).toBe(true)

    expect(db.selectValue('PRAGMA user_version')).toBe(9)
    expect(db.selectValue("SELECT COUNT(*) FROM sqlite_master WHERE name IN ('workouts', 'exercises')")).toBe(0)
    expect(db.selectObjects('SELECT id, name, position FROM routines ORDER BY position')).toEqual([
      { id: 1, name: 'Treino A', position: 1 },
      { id: 2, name: 'Treino B', position: 2 },
    ])
    expect(db.selectObjects('SELECT id, routine_id AS routineId, name, position, completed FROM routine_exercises ORDER BY id')).toEqual([
      { id: 1, routineId: 1, name: 'Supino', position: 1, completed: 1 },
      { id: 2, routineId: 2, name: 'Remada', position: 1, completed: 0 },
      { id: 3, routineId: 1, name: 'Crucifixo', position: 2, completed: 0 },
    ])
    expect(listModels(db)).toEqual([{ id: 1, name: 'Treino ABC Pro', description: 'Modelo inicial migrado dos treinos A, B e C.', position: 1, archived: false, active: true }])
  })

  it('não reaplica migrações já registradas', () => {
    const db = memoryDb()
    migrateDatabase(db)
    expect(migrateDatabase(db)).toBe(false)
  })

  it('ativa o primeiro modelo não arquivado ao atualizar do schema anterior', () => {
    const db = memoryDb()
    db.exec(`
      CREATE TABLE models (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, position INTEGER NOT NULL, archived INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE routine_exercises (id INTEGER PRIMARY KEY, routine_id INTEGER NOT NULL, name TEXT NOT NULL);
      INSERT INTO models (id, name, description, position, archived) VALUES
        (1, 'Arquivado', '', 1, 1),
        (2, 'Modelo ativo', '', 2, 0),
        (3, 'Outro modelo', '', 3, 0);
      PRAGMA user_version = 1;
    `)

    expect(migrateDatabase(db)).toBe(true)
    expect(listModels(db).filter((model) => model.active).map((model) => model.id)).toEqual([2])
    expect(db.selectValue('PRAGMA user_version')).toBe(9)
    expect(db.selectValue("SELECT name FROM pragma_table_info('routine_exercises') WHERE name = 'video_url'")).toBe('video_url')
  })

  it('recupera rotinas sem model_id e as associa ao modelo ativo preservando seus dados', () => {
    const db = memoryDb()
    db.exec(`
      CREATE TABLE models (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, position INTEGER NOT NULL, archived INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE routines (id INTEGER PRIMARY KEY, name TEXT NOT NULL, focus TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL);
      INSERT INTO models (id, name, description, position, active) VALUES (1, 'Arquivado', '', 1, 0), (2, 'Ativo', '', 2, 1);
      INSERT INTO routines (id, name, focus, description, position) VALUES (7, 'Treino salvo', 'Força', 'Rotina antiga', 1);
      PRAGMA user_version = 4;
    `)

    migrateDatabase(db)

    expect(db.selectValue('PRAGMA user_version')).toBe(9)
    expect(db.selectObjects('SELECT id, model_id, name, focus, description, position FROM routines')).toEqual([
      { id: 7, model_id: 2, name: 'Treino salvo', focus: 'Força', description: 'Rotina antiga', position: 1 },
    ])
  })

  it('adiciona model_id às sessões antigas usando o modelo da rotina relacionada', () => {
    const db = memoryDb()
    db.exec(`
      CREATE TABLE models (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, position INTEGER NOT NULL, archived INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE routines (id INTEGER PRIMARY KEY, model_id INTEGER NOT NULL, name TEXT NOT NULL, focus TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL);
      CREATE TABLE training_sessions (id INTEGER PRIMARY KEY, routine_id INTEGER, routine_name TEXT NOT NULL, training_date TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, status TEXT NOT NULL);
      INSERT INTO models (id, name, description, position, active) VALUES (2, 'Ativo', '', 1, 1);
      INSERT INTO routines (id, model_id, name, position) VALUES (9, 2, 'Treino salvo', 1);
      INSERT INTO training_sessions (id, routine_id, routine_name, training_date, started_at, status)
        VALUES (11, 9, 'Treino salvo', '2026-11-21', '2026-11-21T10:00:00.000Z', 'completed');
      PRAGMA user_version = 5;
    `)

    migrateDatabase(db)

    expect(db.selectValue('PRAGMA user_version')).toBe(9)
    expect(db.selectValue('SELECT model_id FROM training_sessions WHERE id = 11')).toBe(2)
  })
  it('adiciona campos faltantes para a edição de exercícios sem apagar registros existentes', () => {
    const db = memoryDb()
    db.exec(`
      CREATE TABLE routine_exercises (id INTEGER PRIMARY KEY, routine_id INTEGER NOT NULL, name TEXT NOT NULL, muscle TEXT NOT NULL, sets_reps TEXT NOT NULL, rest INTEGER NOT NULL, tip TEXT NOT NULL, position INTEGER NOT NULL);
      INSERT INTO routine_exercises (id, routine_id, name, muscle, sets_reps, rest, tip, position)
        VALUES (13, 4, 'Supino', 'Peito', '3 x 12', 60, 'Controle', 2);
      PRAGMA user_version = 6;
    `)

    migrateDatabase(db)

    expect(db.selectValue('PRAGMA user_version')).toBe(9)
    expect(db.selectObjects('SELECT id, name, completed, video_url FROM routine_exercises')).toEqual([
      { id: 13, name: 'Supino', completed: 0, video_url: '' },
    ])
  })

  it('adiciona completed em séries antigas mantendo os dados de carga', () => {
    const db = memoryDb()
    db.exec(`
      CREATE TABLE session_sets (id INTEGER PRIMARY KEY, session_exercise_id INTEGER NOT NULL, position INTEGER NOT NULL, target_repetitions TEXT NOT NULL, load REAL, performed_repetitions INTEGER, logged_at TEXT);
      INSERT INTO session_sets (id, session_exercise_id, position, target_repetitions, load, performed_repetitions)
        VALUES (21, 8, 2, '12', 25, 10);
      PRAGMA user_version = 7;
    `)

    migrateDatabase(db)

    expect(db.selectValue('PRAGMA user_version')).toBe(9)
    expect(db.selectObjects('SELECT id, position, load, performed_repetitions, completed FROM session_sets')).toEqual([
      { id: 21, position: 2, load: 25, performed_repetitions: 10, completed: 0 },
    ])
  })
})

describe('model repository', () => {
  it('bloqueia o sexto modelo, contando os arquivados', () => {
    const db = memoryDb()
    migrateDatabase(db)
    for (let index = 0; index < MAX_MODELS; index++) {
      createModel(db, { name: `Modelo ${index + 1}`, description: '' })
    }
    setModelArchived(db, 1, true)

    expect(() => createModel(db, { name: 'Sexto', description: '' })).toThrow(ModelLimitError)
    expect(listModels(db)).toHaveLength(MAX_MODELS)
  })

  it('oculta arquivados apenas quando solicitado e reordena sem perder itens', () => {
    const db = memoryDb()
    migrateDatabase(db)
    const first = createModel(db, { name: 'Push', description: '' })
    const second = createModel(db, { name: 'Pull', description: '' })
    setModelArchived(db, first, true)

    expect(listModels(db, { includeArchived: false }).map((model) => model.name)).toEqual(['Pull'])

    reorderItems(db, 'models', [second, first])
    expect(listModels(db).map((model) => model.name)).toEqual(['Pull', 'Push'])
    expect(() => reorderItems(db, 'models', [second])).toThrow()
  })

  it('mantém um modelo ativo e transfere a ativação ao arquivar o atual', () => {
    const db = memoryDb()
    migrateDatabase(db)
    const first = createModel(db, { name: 'Push', description: '' })
    const second = createModel(db, { name: 'Pull', description: '' })

    expect(getActiveModelId(db)).toBe(first)
    setModelActive(db, second)
    expect(getActiveModelId(db)).toBe(second)

    setModelArchived(db, second, true)
    expect(getActiveModelId(db)).toBe(first)
    expect(() => setModelActive(db, second)).toThrow('Um modelo arquivado não pode ser ativado.')
  })

  it('ativa um modelo ao desarquivá-lo quando não há outro ativo', () => {
    const db = memoryDb()
    migrateDatabase(db)
    const modelId = createModel(db, { name: 'Push', description: '' })
    setModelArchived(db, modelId, true)
    expect(getActiveModelId(db)).toBe(0)

    setModelArchived(db, modelId, false)

    expect(getActiveModelId(db)).toBe(modelId)
  })
})

describe('routine repository', () => {
  function setup() {
    const db = memoryDb()
    migrateDatabase(db)
    const modelId = createModel(db, { name: 'ABC', description: '' })
    const otherModelId = createModel(db, { name: 'Outro', description: '' })
    return { db, modelId, otherModelId }
  }

  it('acrescenta rotinas no fim do modelo e reordena apenas dentro dele', () => {
    const { db, modelId, otherModelId } = setup()
    const a = createRoutine(db, modelId, { name: 'A', focus: '', description: '' })
    const b = createRoutine(db, modelId, { name: 'B', focus: '', description: '' })
    const other = createRoutine(db, otherModelId, { name: 'X', focus: '', description: '' })

    reorderRoutines(db, modelId, [b, a])

    expect(listRoutines(db, modelId).map((routine) => routine.id)).toEqual([b, a])
    expect(listRoutines(db, otherModelId).map((routine) => routine.id)).toEqual([other])
  })

  it('remove exercícios ao excluir a rotina e zera o progresso manual', () => {
    const { db, modelId } = setup()
    const routineId = createRoutine(db, modelId, { name: 'A', focus: '', description: '' })
    const exerciseInput = { routineId, name: 'Supino', muscle: 'Peito', setsReps: '3 x 12', rest: 60, tip: '', videoUrl: '' }
    const first = createRoutineExercise(db, exerciseInput)
    createRoutineExercise(db, { ...exerciseInput, name: 'Crucifixo' })

    setRoutineExerciseCompleted(db, first, true)
    expect(listRoutineExercises(db, routineId)[0].completed).toBe(true)

    resetRoutineProgress(db, routineId)
    expect(listRoutineExercises(db, routineId).every((exercise) => !exercise.completed)).toBe(true)

    deleteRoutine(db, routineId)
    expect(listRoutineExercises(db, routineId)).toEqual([])
  })

  it('edita treinos e exercícios preservando a rotina e os dados atualizados', () => {
    const { db, modelId } = setup()
    const firstRoutineId = createRoutine(db, modelId, { name: 'Treino A', focus: 'Empurrar', description: '' })
    const secondRoutineId = createRoutine(db, modelId, { name: 'Treino B', focus: 'Puxar', description: '' })
    const exerciseId = createRoutineExercise(db, {
      routineId: firstRoutineId,
      name: 'Supino',
      muscle: 'Peito',
      setsReps: '3 x 12',
      rest: 60,
      tip: 'Controle a descida.',
      videoUrl: '',
    })

    updateRoutine(db, firstRoutineId, { name: 'Treino superior A', focus: 'Peito', description: 'Força' })
    updateRoutineExercise(db, exerciseId, {
      routineId: secondRoutineId,
      name: 'Supino inclinado',
      muscle: 'Peitoral superior',
      setsReps: '4 x 10',
      rest: 90,
      tip: 'Mantenha a escápula estável.',
      videoUrl: 'https://example.com/video',
    })

    expect(listRoutines(db, modelId)[0]).toMatchObject({ id: firstRoutineId, name: 'Treino superior A', focus: 'Peito', description: 'Força' })
    expect(listRoutineExercises(db, firstRoutineId)).toEqual([])
    expect(listRoutineExercises(db, secondRoutineId)[0]).toMatchObject({
      id: exerciseId,
      name: 'Supino inclinado',
      setsReps: '4 x 10',
      rest: 90,
      videoUrl: 'https://example.com/video',
    })

    deleteRoutineExercise(db, exerciseId)
    expect(listRoutineExercises(db, secondRoutineId)).toEqual([])
  })
})
