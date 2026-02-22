import { openDb, closeDb, runStatement } from './open'

export async function ingestCsv(dbPath: string, csvPath: string): Promise<void> {
  const db = await openDb(dbPath)
  try {
    const pathForSql = csvPath.replace(/\\/g, '/').replace(/'/g, "''")
    await runStatement(db, `CREATE TABLE data AS SELECT * FROM read_csv_auto('${pathForSql}', header = true)`)
  } finally {
    await closeDb(db)
  }
}
