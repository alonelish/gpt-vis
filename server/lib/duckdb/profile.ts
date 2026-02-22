import type { Database } from 'duckdb'
import { openDb, closeDb, runDb } from './open'

type CountRow = { count: number }

/** Get row count from an already-open database. */
export async function getRowCountFromDb(db: Database): Promise<number> {
  const rows = await runDb<CountRow>(db, 'SELECT COUNT(*)::INTEGER AS count FROM data')
  return Number(rows[0]?.count ?? 0)
}

export async function getRowCount(dbPath: string): Promise<number> {
  const db = await openDb(dbPath)
  try {
    return await getRowCountFromDb(db)
  } finally {
    await closeDb(db)
  }
}
