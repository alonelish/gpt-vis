import * as datasetStore from '../lib/datasetStore'
import { runQuery } from '../lib/duckdb/query'
import { guardSql, maybeAppendLimit } from '../lib/security/sqlGuard'
import { callOpenRouter, parseJson } from '../lib/llm/client'
import { PlanSchema, normalizeChartSpec } from '../lib/llm/schemas'
import {
  PLANNER_SYSTEM,
  EXPLAINER_SYSTEM,
  buildPlannerUserPayload,
  buildExplainerUserPayload
} from '../lib/llm/prompts'
import { shapeChartData } from '../lib/chartShape'
import { jsonSafe } from '../lib/jsonSafe'
import type { ChartSpec } from '../lib/types'

const MAX_ROWS = 5000

export default defineEventHandler(async (event) => {
  const body = await readBody<{ datasetId: string; question: string }>(event)
  const datasetId = body?.datasetId
  const question = body?.question?.trim()
  if (!datasetId || !question) {
    throw createError({ statusCode: 400, message: 'datasetId and question required' })
  }
  const rec = datasetStore.get(datasetId)
  if (!rec || !rec.ready || !rec.schema || rec.rowCount == null) {
    throw createError({ statusCode: 400, message: 'Dataset not ready' })
  }

  let plannerRaw: string
  let parsed: { needsClarification: boolean; clarificationQuestion?: string; sql?: string; chartSpec?: ChartSpec }
  try {
    plannerRaw = await callOpenRouter([
      { role: 'system', content: PLANNER_SYSTEM },
      { role: 'user', content: buildPlannerUserPayload({
        question,
        schema: rec.schema,
        rowCount: rec.rowCount
      }) }
    ])
    parsed = PlanSchema.parse(parseJson(plannerRaw)) as typeof parsed
  } catch (_e) {
    try {
      plannerRaw = await callOpenRouter([
        { role: 'system', content: PLANNER_SYSTEM },
        { role: 'user', content: buildPlannerUserPayload({
          question,
          schema: rec.schema,
          rowCount: rec.rowCount
        }) }
      ])
      parsed = PlanSchema.parse(parseJson(plannerRaw)) as typeof parsed
    } catch (_retryErr) {
      throw createError({
        statusCode: 502,
        message: 'LLM plan invalid or unavailable: ' + _retryErr
      })
    }
  }

  if (parsed.needsClarification && parsed.clarificationQuestion) {
    return { clarificationQuestion: parsed.clarificationQuestion }
  }

  if (!parsed.sql || !parsed.chartSpec) {
    throw createError({ statusCode: 502, message: 'LLM did not return SQL and chartSpec' })
  }

  let chartSpec: ChartSpec
  try {
    chartSpec = normalizeChartSpec(parsed.chartSpec)
  } catch (err) {
    throw createError({
      statusCode: 502,
      message: err instanceof Error ? err.message : 'Invalid chartSpec from LLM'
    })
  }

  const guard = guardSql(parsed.sql)
  if (!guard.allowed) {
    throw createError({ statusCode: 400, message: guard.error ?? 'SQL not allowed' })
  }
  const sql = maybeAppendLimit(parsed.sql, 500)

  let data: Record<string, unknown>[]
  try {
    data = jsonSafe(await runQuery(rec.dbPath, sql, { maxRows: MAX_ROWS }))
  } catch (err) {
    throw createError({
      statusCode: 400,
      message: err instanceof Error ? err.message : 'Query failed'
    })
  }

  if (data.length === 0) {
    return {
      answerText: 'No rows match your question. Try rephrasing or relaxing filters.',
      sql,
      data: [],
      chartSpec,
      warnings: ['No data returned']
    }
  }

  const shaped = shapeChartData(data, chartSpec)
  let answerText: string
  try {
    answerText = await callOpenRouter([
      { role: 'system', content: EXPLAINER_SYSTEM },
      { role: 'user', content: buildExplainerUserPayload({
        question,
        chartSpec: chartSpec as Record<string, unknown>,
        computedData: shaped
      }) }
    ])
  } catch (_) {
    answerText = 'Results are ready. See the chart and data below.'
  }

  return {
    answerText,
    sql,
    data: shaped,
    chartSpec
  }
})
