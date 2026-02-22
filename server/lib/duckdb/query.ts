import { openDb, closeDb, runDb } from './open'

const DEFAULT_MAX_ROWS = 5000
const DEFAULT_TIMEOUT_MS = 60_000

export async function runQuery(
  dbPath: string,
  sql: string,
  options?: { timeoutMs?: number; maxRows?: number }
): Promise<Record<string, unknown>[]> {
  const maxRows = options?.maxRows ?? DEFAULT_MAX_ROWS
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const db = await openDb(dbPath)
  try {
    const limited = sql.trimEnd().endsWith(';') ? sql.trimEnd().slice(0, -1) : sql
    const withLimit = limited + (limited.toUpperCase().includes(' LIMIT ') ? '' : ` LIMIT ${maxRows}`)
    const rows = await Promise.race([
      runDb<Record<string, unknown>>(db, withLimit),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
      )
    ])
    return rows.slice(0, maxRows)
  } finally {
    await closeDb(db)
  }
}
