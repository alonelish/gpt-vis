import type { SchemaColumn } from './types'

export type DatasetRecord = {
  filePath: string
  dbPath: string
  schema?: { columns: SchemaColumn[] }
  rowCount?: number
  ready: boolean
}

const store = new Map<string, DatasetRecord>()

export function create(id: string, filePath: string, dbPath: string): void {
  store.set(id, {
    filePath,
    dbPath,
    ready: false
  })
}

export function get(id: string): DatasetRecord | undefined {
  return store.get(id)
}

export function setReady(
  id: string,
  schema: { columns: SchemaColumn[] },
  rowCount: number
): void {
  const rec = store.get(id)
  if (rec) {
    rec.schema = schema
    rec.rowCount = rowCount
    rec.ready = true
  }
}

export function list(): { id: string; ready: boolean; rowCount?: number }[] {
  return Array.from(store.entries()).map(([id, rec]) => ({
    id,
    ready: rec.ready,
    rowCount: rec.rowCount
  }))
}
