import type { Database } from 'duckdb'
import { openDb, closeDb, runStatement } from './open'

/** Run ingest using an already-open database (avoids open/close race on Windows). */
export async function ingestWithDb(db: Database, csvPath: string): Promise<void> {
  const pathForSql = csvPath.replace(/\\/g, '/').replace(/'/g, "''")
  await runStatement(db, `CREATE TABLE data AS SELECT * FROM read_csv_auto('${pathForSql}', header = true)`)
}

export async function ingestCsv(dbPath: string, csvPath: string): Promise<void> {
  const db = await openDb(dbPath)
  try {
    await ingestWithDb(db, csvPath)
  } finally {
    await closeDb(db)
  }
}
