import { openDb, closeDb, runDb } from './open'

type CountRow = { count: number }

export async function getRowCount(dbPath: string): Promise<number> {
  const db = await openDb(dbPath)
  try {
    const rows = await runDb<CountRow>(db, 'SELECT COUNT(*)::INTEGER AS count FROM data')
    return Number(rows[0]?.count ?? 0)
  } finally {
    await closeDb(db)
  }
}
