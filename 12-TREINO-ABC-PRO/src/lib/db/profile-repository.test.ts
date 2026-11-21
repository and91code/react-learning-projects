import sqlite3InitModule from '@sqlite.org/sqlite-wasm'
import { beforeAll, describe, expect, it } from 'vitest'
import { migrateDatabase } from './migrations'
import { getLocalProfile, MAX_PROFILE_PHOTO_BYTES, saveLocalProfile } from './profile-repository'
import type { SqliteDatabase, SqliteModule } from './types'

let sqlite3: SqliteModule

beforeAll(async () => {
  sqlite3 = await sqlite3InitModule()
})

function memoryDb(): SqliteDatabase {
  const db = new sqlite3.oo1.DB(':memory:') as SqliteDatabase
  migrateDatabase(db)
  return db
}

describe('profile repository', () => {
  it('loads the initial local profile and saves a trimmed name', () => {
    const db = memoryDb()

    expect(getLocalProfile(db)).toEqual({ name: 'Atleta', photoDataUrl: null })
    saveLocalProfile(db, { name: '  Ana  ', photoDataUrl: null })

    expect(getLocalProfile(db)).toEqual({ name: 'Ana', photoDataUrl: null })
  })

  it('accepts a WebP profile photo within the configured size and rejects oversized or non-WebP data', () => {
    const db = memoryDb()
    const photo = `data:image/webp;base64,${'A'.repeat(4 * Math.floor(MAX_PROFILE_PHOTO_BYTES / 3))}`

    expect(() => saveLocalProfile(db, { name: 'Ana', photoDataUrl: photo })).not.toThrow()
    expect(() => saveLocalProfile(db, {
      name: 'Ana',
      photoDataUrl: `data:image/webp;base64,${'A'.repeat(4 * Math.ceil((MAX_PROFILE_PHOTO_BYTES + 1) / 3))}`,
    })).toThrow('não pode exceder 200 KiB')
    expect(() => saveLocalProfile(db, { name: 'Ana', photoDataUrl: 'data:image/png;base64,AAAA' })).toThrow('formato WebP')
  })
})
