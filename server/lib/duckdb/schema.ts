import type { Database } from 'duckdb'
import { openDb, closeDb, runDb } from './open'
import type { SchemaColumn } from '../types'

type InfoRow = { column_name: string; data_type: string }

/** Get schema from an already-open database. */
export async function getSchemaFromDb(db: Database): Promise<{ columns: SchemaColumn[] }> {
  const rows = await runDb<InfoRow>(
    db,
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'data' ORDER BY ordinal_position`
  )
  return {
    columns: rows.map((r) => ({ name: r.column_name, type: r.data_type }))
  }
}

export async function getSchema(dbPath: string): Promise<{ columns: SchemaColumn[] }> {
  const db = await openDb(dbPath)
  try {
    return await getSchemaFromDb(db)
  } finally {
    await closeDb(db)
  }
}
