import type { SqliteDatabase } from './types'

type Migration = {
  version: number
  up: (db: SqliteDatabase) => void
}

function hasTable(db: SqliteDatabase, name: string) {
  return db.selectValue("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", [name]) !== undefined
}

function hasColumn(db: SqliteDatabase, table: string, column: string) {
  return db.selectValue(
    `SELECT name FROM pragma_table_info('${table}') WHERE name = ?`,
    [column],
  ) !== undefined
}

function addColumnIfMissing(db: SqliteDatabase, table: string, column: string, definition: string) {
  if (!hasTable(db, table) || hasColumn(db, table, column)) return
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}

function ensureRoutineModelId(db: SqliteDatabase) {
  if (!hasTable(db, 'routines') || hasColumn(db, 'routines', 'model_id')) return

  if (Number(db.selectValue('SELECT COUNT(*) FROM models')) === 0) {
    db.exec(`
      INSERT INTO models (id, name, description, position, archived, active)
      VALUES (1, 'Treino ABC Pro', 'Modelo recuperado automaticamente.', 1, 0, 1)
    `)
  }
  const modelId = Number(db.selectValue(
    'SELECT id FROM models WHERE archived = 0 AND active = 1 ORDER BY position, id LIMIT 1',
  ) ?? db.selectValue('SELECT id FROM models WHERE archived = 0 ORDER BY position, id LIMIT 1') ?? 1)
  db.exec(`ALTER TABLE routines ADD COLUMN model_id INTEGER NOT NULL DEFAULT ${modelId}`)
  db.exec('CREATE INDEX IF NOT EXISTS routines_by_model ON routines(model_id, position)')
}

function ensureRoutineExerciseColumns(db: SqliteDatabase) {
  addColumnIfMissing(db, 'routine_exercises', 'routine_id', 'INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing(db, 'routine_exercises', 'name', "TEXT NOT NULL DEFAULT ''")
  addColumnIfMissing(db, 'routine_exercises', 'muscle', "TEXT NOT NULL DEFAULT ''")
  addColumnIfMissing(db, 'routine_exercises', 'sets_reps', "TEXT NOT NULL DEFAULT ''")
  addColumnIfMissing(db, 'routine_exercises', 'rest', 'INTEGER NOT NULL DEFAULT 60')
  addColumnIfMissing(db, 'routine_exercises', 'tip', "TEXT NOT NULL DEFAULT ''")
  addColumnIfMissing(db, 'routine_exercises', 'position', 'INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing(db, 'routine_exercises', 'completed', 'INTEGER NOT NULL DEFAULT 0')
  addColumnIfMissing(db, 'routine_exercises', 'video_url', "TEXT NOT NULL DEFAULT ''")
}

function ensureSessionSetColumns(db: SqliteDatabase) {
  addColumnIfMissing(db, 'session_sets', 'position', 'INTEGER NOT NULL DEFAULT 1')
  addColumnIfMissing(db, 'session_sets', 'target_repetitions', "TEXT NOT NULL DEFAULT ''")
  addColumnIfMissing(db, 'session_sets', 'load', 'REAL')
  addColumnIfMissing(db, 'session_sets', 'performed_repetitions', 'INTEGER')
  addColumnIfMissing(db, 'session_sets', 'logged_at', 'TEXT')
  addColumnIfMissing(db, 'session_sets', 'completed', 'INTEGER NOT NULL DEFAULT 0')
}

function ensureTrainingSessionModelId(db: SqliteDatabase) {
  if (!hasTable(db, 'training_sessions') || hasColumn(db, 'training_sessions', 'model_id')) return

  const defaultModelId = Number(db.selectValue(
    'SELECT id FROM models WHERE archived = 0 AND active = 1 ORDER BY position, id LIMIT 1',
  ) ?? db.selectValue('SELECT id FROM models WHERE archived = 0 ORDER BY position, id LIMIT 1') ?? 1)
  db.exec(`ALTER TABLE training_sessions ADD COLUMN model_id INTEGER NOT NULL DEFAULT ${defaultModelId}`)
  if (hasColumn(db, 'training_sessions', 'routine_id')) {
    db.exec(`
      UPDATE training_sessions
      SET model_id = COALESCE(
        (SELECT routines.model_id FROM routines WHERE routines.id = training_sessions.routine_id),
        model_id
      )
    `)
  }
  db.exec('CREATE INDEX IF NOT EXISTS training_sessions_by_model ON training_sessions(model_id, status)')
}

const migrations: Migration[] = [
  {
    version: 1,
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS models (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          position INTEGER NOT NULL,
          archived INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE TABLE IF NOT EXISTS routines (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          focus TEXT NOT NULL DEFAULT '',
          description TEXT NOT NULL DEFAULT '',
          position INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE TABLE IF NOT EXISTS routine_exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          muscle TEXT NOT NULL,
          sets_reps TEXT NOT NULL,
          rest INTEGER NOT NULL DEFAULT 60,
          tip TEXT NOT NULL DEFAULT '',
          position INTEGER NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
      `)

      // Converte o schema legado (workouts/exercises) preservando os ids e a ordem de criação.
      if (!hasTable(db, 'workouts')) return

      db.exec(`
        INSERT INTO models (id, name, description, position) VALUES (1, 'Treino ABC Pro', 'Modelo inicial migrado dos treinos A, B e C.', 1);
        INSERT INTO routines (id, model_id, name, focus, description, position)
          SELECT id, 1, name, focus, description, ROW_NUMBER() OVER (ORDER BY id) FROM workouts;
        INSERT INTO routine_exercises (id, routine_id, name, muscle, sets_reps, rest, tip, position, completed)
          SELECT id, workout_id, name, muscle, sets_reps, rest, tip, ROW_NUMBER() OVER (PARTITION BY workout_id ORDER BY id), completed FROM exercises;
        DROP TABLE exercises;
        DROP TABLE workouts;
      `)
    },
  },
  {
    version: 2,
    up(db) {
      db.exec(`
        ALTER TABLE models ADD COLUMN active INTEGER NOT NULL DEFAULT 0;
        UPDATE models SET active = 1
        WHERE id = (
          SELECT id FROM models WHERE archived = 0 ORDER BY position, id LIMIT 1
        );
      `)
    },
  },
  {
    version: 3,
    up(db) {
      db.exec("ALTER TABLE routine_exercises ADD COLUMN video_url TEXT NOT NULL DEFAULT ''")
    },
  },
  {
    version: 4,
    up(db) {
      db.exec(`
        CREATE TABLE training_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE RESTRICT,
          routine_id INTEGER REFERENCES routines(id) ON DELETE SET NULL,
          routine_name TEXT NOT NULL,
          training_date TEXT NOT NULL,
          started_at TEXT NOT NULL,
          finished_at TEXT,
          status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'partial', 'stopped')),
          current_exercise_id INTEGER,
          current_set_position INTEGER,
          rest_started_at TEXT,
          rest_duration_seconds INTEGER,
          seconds_per_set INTEGER NOT NULL DEFAULT 50
        );
        CREATE UNIQUE INDEX one_in_progress_training_session
          ON training_sessions(status) WHERE status = 'in_progress';
        CREATE TABLE session_exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
          source_exercise_id INTEGER REFERENCES routine_exercises(id) ON DELETE SET NULL,
          name TEXT NOT NULL,
          muscle TEXT NOT NULL,
          sets_reps TEXT NOT NULL,
          rest_seconds INTEGER NOT NULL,
          estimated_duration_seconds INTEGER NOT NULL DEFAULT 0,
          tip TEXT NOT NULL DEFAULT '',
          video_url TEXT NOT NULL DEFAULT '',
          position INTEGER NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
          started_at TEXT,
          completed_at TEXT
        );
        CREATE TABLE session_sets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_exercise_id INTEGER NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
          position INTEGER NOT NULL,
          target_repetitions TEXT NOT NULL,
          load REAL,
          performed_repetitions INTEGER,
          logged_at TEXT,
          completed INTEGER NOT NULL DEFAULT 0,
          UNIQUE (session_exercise_id, position)
        );
        CREATE INDEX session_exercises_by_session
          ON session_exercises(session_id, position);
        CREATE INDEX training_sessions_by_date
          ON training_sessions(training_date, status);
      `)
    },
  },
  {
    version: 5,
    up(db) {
      ensureRoutineModelId(db)
    },
  },
  {
    version: 6,
    up(db) {
      ensureRoutineModelId(db)
      ensureTrainingSessionModelId(db)
    },
  },
  {
    version: 7,
    up(db) {
      ensureRoutineExerciseColumns(db)
    },
  },
  {
    version: 8,
    up(db) {
      ensureSessionSetColumns(db)
    },
  },
  {
    version: 9,
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS local_profile (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          name TEXT NOT NULL,
          photo_data_url TEXT,
          updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )
      `)
    },
  },
]

export function migrateDatabase(db: SqliteDatabase): boolean {
  const current = Number(db.selectValue('PRAGMA user_version'))
  const pending = migrations.filter((migration) => migration.version > current)

  for (const migration of pending) {
    db.transaction(() => {
      migration.up(db)
      db.exec(`PRAGMA user_version = ${migration.version}`)
    })
  }

  ensureRoutineModelId(db)
  ensureRoutineExerciseColumns(db)
  ensureSessionSetColumns(db)
  ensureTrainingSessionModelId(db)
  return pending.length > 0
}
