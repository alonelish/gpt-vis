import * as datasetStore from '../../lib/datasetStore'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Dataset ID required' })
  const rec = datasetStore.get(id)
  if (!rec) throw createError({ statusCode: 404, message: 'Dataset not found' })
  if (!rec.ready) throw createError({ statusCode: 400, message: 'Dataset not ready' })
  return {
    id,
    schema: rec.schema,
    rowCount: rec.rowCount,
    ready: rec.ready
  }
})
