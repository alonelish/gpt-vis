import { randomUUID } from 'node:crypto'
import { writeFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import * as datasetStore from '../lib/datasetStore'
import { ensureDataDir } from '../lib/duckdb/open'
import { ingestCsv } from '../lib/duckdb/ingest'
import { getSchema } from '../lib/duckdb/schema'
import { getRowCount } from '../lib/duckdb/profile'

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
    await ingestCsv(dbPath, filePath)
    const schema = await getSchema(dbPath)
    const rowCount = await getRowCount(dbPath)
    datasetStore.setReady(id, schema, rowCount)
    return { id, schema, rowCount }
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
