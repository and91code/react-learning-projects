import { profileSchema } from '../../domain/training/schemas'
import type { SqliteDatabase } from './types'

export const MAX_PROFILE_PHOTO_BYTES = 200 * 1024

export type LocalProfile = {
  name: string
  photoDataUrl: string | null
}

function assertPhotoDataUrl(photoDataUrl: string | null) {
  if (photoDataUrl === null) return
  const prefix = 'data:image/webp;base64,'
  if (!photoDataUrl.startsWith(prefix)) throw new Error('A foto do perfil deve estar no formato WebP.')
  const base64 = photoDataUrl.slice(prefix.length)
  if (!base64 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) {
    throw new Error('A foto do perfil não contém dados WebP válidos.')
  }
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  const bytes = Math.floor(base64.length * 3 / 4) - padding
  if (bytes > MAX_PROFILE_PHOTO_BYTES) throw new Error('A foto do perfil não pode exceder 200 KiB.')
}

export function getLocalProfile(db: SqliteDatabase): LocalProfile {
  const row = db.selectObject('SELECT name, photo_data_url AS photoDataUrl FROM local_profile WHERE id = 1') as LocalProfile | undefined
  if (row) return row
  return { name: 'Atleta', photoDataUrl: null }
}

export function saveLocalProfile(db: SqliteDatabase, input: LocalProfile) {
  const profile = profileSchema.parse(input)
  assertPhotoDataUrl(profile.photoDataUrl)
  db.exec({
    sql: `INSERT INTO local_profile (id, name, photo_data_url)
          VALUES (1, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            photo_data_url = excluded.photo_data_url,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    bind: [profile.name, profile.photoDataUrl],
  })
}
