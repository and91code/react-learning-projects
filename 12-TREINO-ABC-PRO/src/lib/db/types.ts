import type sqlite3InitModule from '@sqlite.org/sqlite-wasm'

export type SqliteModule = Awaited<ReturnType<typeof sqlite3InitModule>>
export type SqliteDatabase = InstanceType<SqliteModule['oo1']['DB']>
export type SqliteValue = string | number | null | Uint8Array
