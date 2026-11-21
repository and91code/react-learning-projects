import type { SqliteDatabase } from './types'

export const MAX_MODELS = 5

export class ModelLimitError extends Error {
  constructor() {
    super(`Você pode cadastrar no máximo ${MAX_MODELS} modelos, incluindo os arquivados.`)
    this.name = 'ModelLimitError'
  }
}

export type WorkoutModel = {
  id: number
  name: string
  description: string
  position: number
  archived: boolean
  active: boolean
}

export type WorkoutModelInput = Pick<WorkoutModel, 'name' | 'description'>

type ModelRow = Omit<WorkoutModel, 'archived' | 'active'> & { archived: number; active: number }

export function listModels(db: SqliteDatabase, { includeArchived = true } = {}): WorkoutModel[] {
  const rows = db.selectObjects(
    `SELECT id, name, description, position, archived, active FROM models ${includeArchived ? '' : 'WHERE archived = 0'} ORDER BY position, id`,
  ) as ModelRow[]
  return rows.map((row) => ({ ...row, archived: Boolean(row.archived), active: Boolean(row.active) }))
}

export function createModel(db: SqliteDatabase, input: WorkoutModelInput): number {
  return db.transaction(() => {
    const count = Number(db.selectValue('SELECT COUNT(*) FROM models'))
    if (count >= MAX_MODELS) throw new ModelLimitError()

    const position = Number(db.selectValue('SELECT COALESCE(MAX(position), 0) + 1 FROM models'))
    const active = Number(db.selectValue('SELECT COUNT(*) FROM models WHERE active = 1 AND archived = 0')) === 0
    db.exec({
      sql: 'INSERT INTO models (name, description, position, active) VALUES (?, ?, ?, ?)',
      bind: [input.name, input.description, position, Number(active)],
    })
    return Number(db.selectValue('SELECT last_insert_rowid()'))
  })
}

export function updateModel(db: SqliteDatabase, id: number, input: WorkoutModelInput) {
  db.exec({ sql: 'UPDATE models SET name = ?, description = ? WHERE id = ?', bind: [input.name, input.description, id] })
}

/** Arquivar apenas oculta o modelo da tela inicial; nada é removido. */
export function setModelArchived(db: SqliteDatabase, id: number, archived: boolean) {
  db.transaction(() => {
    db.exec({ sql: 'UPDATE models SET archived = ?, active = CASE WHEN ? = 1 THEN 0 ELSE active END WHERE id = ?', bind: [Number(archived), Number(archived), id] })
    const hasActive = Number(db.selectValue('SELECT COUNT(*) FROM models WHERE active = 1 AND archived = 0')) > 0
    if (!hasActive) {
      if (archived) {
        db.exec({
          sql: 'UPDATE models SET active = 1 WHERE id = (SELECT id FROM models WHERE archived = 0 ORDER BY position, id LIMIT 1)',
        })
      } else {
        db.exec({ sql: 'UPDATE models SET active = 1 WHERE id = ?', bind: [id] })
      }
    }
  })
}

export function setModelActive(db: SqliteDatabase, id: number) {
  db.transaction(() => {
    const isArchived = db.selectValue('SELECT archived FROM models WHERE id = ?', [id])
    if (isArchived === undefined) throw new Error('O modelo selecionado não existe.')
    if (Number(isArchived)) throw new Error('Um modelo arquivado não pode ser ativado.')
    db.exec('UPDATE models SET active = 0')
    db.exec({ sql: 'UPDATE models SET active = 1 WHERE id = ?', bind: [id] })
  })
}

export function reorderModels(db: SqliteDatabase, orderedIds: number[]) {
  reorderItems(db, 'models', orderedIds)
}

/** Grava a nova ordem informada pelo usuário; `orderedIds` precisa conter exatamente os ids de `table`. */
export function reorderItems(db: SqliteDatabase, table: 'models' | 'routines', orderedIds: number[], scopeSql = '', scopeBind: number[] = []) {
  db.transaction(() => {
    const currentIds = db.selectValues(`SELECT id FROM ${table} ${scopeSql}`, scopeBind.length ? scopeBind : undefined) as number[]
    const orderedSet = new Set(orderedIds)
    const sameItems = currentIds.length === orderedIds.length && orderedSet.size === orderedIds.length && currentIds.every((id) => orderedSet.has(id))
    if (!sameItems) throw new Error('A nova ordem precisa conter exatamente os itens atuais.')

    orderedIds.forEach((id, index) => {
      db.exec({ sql: `UPDATE ${table} SET position = ? WHERE id = ?`, bind: [index + 1, id] })
    })
  })
}
