import { randomUUID } from 'node:crypto'
import { writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import * as datasetStore from '../lib/datasetStore'
import { ensureDataDir, openDb, closeDb } from '../lib/duckdb/open'
import { ingestWithDb } from '../lib/duckdb/ingest'
import { getSchemaFromDb } from '../lib/duckdb/schema'
import { getRowCountFromDb } from '../lib/duckdb/profile'

const UPLOAD_DIR = join(process.cwd(), '.data', 'uploads')

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const file = form?.find((f) => f.name === 'file' && f.data)
  if (!file?.data) {
    throw createError({ statusCode: 400, message: 'No CSV file provided' })
  }
  const id = randomUUID()
  await mkdir(UPLOAD_DIR, { recursive: true })
  const filePath = join(UPLOAD_DIR, `${id}.csv`)
  const dbPath = join(process.cwd(), '.data', 'duckdb', `${id}.duckdb`)
  try {
    await writeFile(filePath, file.data)
    await ensureDataDir()
    datasetStore.create(id, filePath, dbPath)
    const db = await openDb(dbPath)
    try {
      await ingestWithDb(db, filePath)
      const schema = await getSchemaFromDb(db)
      const rowCount = await getRowCountFromDb(db)
      datasetStore.setReady(id, schema, rowCount)
      return { id, schema, rowCount }
    } finally {
      await closeDb(db)
    }
  } catch (err) {
    try {
      await unlink(filePath).catch(() => {})
      await unlink(dbPath).catch(() => {})
    } catch (_) {}
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : 'Upload failed'
    })
  }
})
