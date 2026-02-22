const FORBIDDEN =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|COPY|ATTACH|DETACH|PRAGMA|INSTALL|LOAD|read_csv|read_csv_auto|read_parquet|glob)\b/i
const TABLE_REF = /\bFROM\s+(\w+)/gi
const ALLOWED_TABLE = 'data'

export type GuardResult = { allowed: true } | { allowed: false; error: string }

export function guardSql(sql: string): GuardResult {
  const trimmed = sql.trim()
  if (!trimmed.toUpperCase().startsWith('SELECT')) {
    return { allowed: false, error: 'Only SELECT queries are allowed' }
  }
  const beforeSemicolon = trimmed.split(';')[0]
  if (trimmed.includes(';') && beforeSemicolon?.trim().length > 0) {
    const rest = trimmed.slice(trimmed.indexOf(';') + 1).trim()
    if (rest.length > 0) return { allowed: false, error: 'Multiple statements not allowed' }
  }
  if (FORBIDDEN.test(trimmed)) {
    return { allowed: false, error: 'Query contains forbidden keywords' }
  }
  let match: RegExpExecArray | null
  TABLE_REF.lastIndex = 0
  while ((match = TABLE_REF.exec(trimmed)) !== null) {
    const table = match[1]
    if (table && table.toLowerCase() !== ALLOWED_TABLE) {
      return { allowed: false, error: `Only table "${ALLOWED_TABLE}" is allowed` }
    }
  }
  const joinRef = /\bJOIN\s+(\w+)/gi
  while ((match = joinRef.exec(trimmed)) !== null) {
    const table = match[1]
    if (table && table.toLowerCase() !== ALLOWED_TABLE) {
      return { allowed: false, error: `Only table "${ALLOWED_TABLE}" is allowed` }
    }
  }
  return { allowed: true }
}

export function maybeAppendLimit(sql: string, maxRows: number): string {
  const trimmed = sql.trim().replace(/;\s*$/, '')
  if (trimmed.toUpperCase().includes(' LIMIT ')) return trimmed
  return trimmed + ` LIMIT ${maxRows}`
}
