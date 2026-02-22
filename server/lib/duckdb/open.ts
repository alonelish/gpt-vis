import duckdb from 'duckdb'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

export type DuckDBConnection = duckdb.Database

const dataDir = join(process.cwd(), '.data', 'duckdb')

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
