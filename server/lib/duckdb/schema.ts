import { openDb, closeDb, runDb } from './open'
import type { SchemaColumn } from '../types'

type InfoRow = { column_name: string; data_type: string }

export async function getSchema(dbPath: string): Promise<{ columns: SchemaColumn[] }> {
  const db = await openDb(dbPath)
  try {
    const rows = await runDb<InfoRow>(
      db,
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'data' ORDER BY ordinal_position`
    )
    return {
      columns: rows.map((r) => ({ name: r.column_name, type: r.data_type }))
    }
  } finally {
    await closeDb(db)
  }
}
