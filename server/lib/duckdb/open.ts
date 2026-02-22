import duckdb from 'duckdb'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

export type DuckDBConnection = duckdb.Database

const dataDir = join(process.cwd(), '.data', 'duckdb')

/** Serialize access per dbPath so we never open the same file concurrently (avoids "file in use" on Windows/HMR). */
const pathLocks = new Map<string, Promise<unknown>>()

/** Delay (ms) after closing DB before next operation can open - gives Windows time to release the file handle. */
const POST_CLOSE_DELAY_MS = 250

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withDbLock<T>(dbPath: string, fn: () => Promise<T>): Promise<T> {
  const prev = pathLocks.get(dbPath) ?? Promise.resolve()
  const next = prev
    .then(() => fn(), () => fn())
    .then(
      (result) => delay(POST_CLOSE_DELAY_MS).then(() => result),
      (err) => delay(POST_CLOSE_DELAY_MS).then(() => Promise.reject(err))
    )
  pathLocks.set(dbPath, next)
  return next as Promise<T>
}

export async function ensureDataDir(): Promise<string> {
  await mkdir(dataDir, { recursive: true })
  return dataDir
}

export function openDb(dbPath: string): Promise<duckdb.Database> {
  return new Promise((resolve, reject) => {
    const db = new duckdb.Database(dbPath, (err) => {
      if (err) reject(err)
      else resolve(db)
    })
  })
}

export function closeDb(db: duckdb.Database): Promise<void> {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export function runDb<T>(db: duckdb.Database, sql: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => {
      if (err) reject(err)
      else resolve((rows ?? []) as T[])
    })
  })
}

export function runStatement(db: duckdb.Database, sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}
