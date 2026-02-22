import * as datasetStore from '../../../lib/datasetStore'
import { callOpenRouter, parseJson } from '../../../lib/llm/client'
import { SuggestQuestionsSchema } from '../../../lib/llm/schemas'
import { SUGGEST_QUESTIONS_SYSTEM, buildSuggestQuestionsPayload } from '../../../lib/llm/prompts'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Dataset ID required' })
  const rec = datasetStore.get(id)
  if (!rec || !rec.ready || !rec.schema || rec.rowCount == null) {
    throw createError({ statusCode: 400, message: 'Dataset not ready' })
  }
  try {
    const raw = await callOpenRouter([
      { role: 'system', content: SUGGEST_QUESTIONS_SYSTEM },
      { role: 'user', content: buildSuggestQuestionsPayload({ schema: rec.schema, rowCount: rec.rowCount }) }
    ])
    const parsed = SuggestQuestionsSchema.parse(parseJson(raw))
    return { questions: parsed.questions }
  } catch (err) {
    throw createError({
      statusCode: 502,
      message: err instanceof Error ? err.message : 'Failed to suggest questions'
    })
  }
})
