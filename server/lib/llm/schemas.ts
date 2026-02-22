import { z } from 'zod'

export const ChartSpecSchema = z.object({
  type: z.enum(['bar', 'line', 'pie', 'histogram', 'table']),
  title: z.string().min(1).max(120),
  xKey: z.string().min(1),
  yKey: z.string().min(1),
  seriesName: z.string().optional(),
  maxCategories: z.number().int().min(2).max(50).optional(),
  otherLabel: z.string().optional(),
  timeBucket: z.enum(['hour', 'day', 'week', 'month']).optional()
})

/** Accepts our format (xKey/yKey), encoding.x/y.field, or top-level x/y.field. Title optional for lenient LLM output. */
const ChartSpecRawSchema = z.object({
  type: z.enum(['bar', 'line', 'pie', 'histogram', 'table']),
  title: z.string().min(1).max(120).optional(),
  xKey: z.string().min(1).optional(),
  yKey: z.string().min(1).optional(),
  x: z.object({ field: z.string() }).optional(),
  y: z.object({ field: z.string() }).optional(),
  encoding: z.object({
    x: z.object({ field: z.string() }).optional(),
    y: z.object({ field: z.string() }).optional()
  }).optional(),
  seriesName: z.string().optional(),
  maxCategories: z.number().int().min(2).max(50).optional(),
  otherLabel: z.string().optional(),
  timeBucket: z.enum(['hour', 'day', 'week', 'month']).optional()
}).refine(
  (r) =>
    (r.xKey != null && r.yKey != null) ||
    (r.encoding?.x?.field != null && r.encoding?.y?.field != null) ||
    (r.x?.field != null && r.y?.field != null),
  { message: 'chartSpec must have xKey/yKey or encoding.x/y.field or x/y.field' }
)

export const PlanSchema = z.union([
  z.object({
    needsClarification: z.literal(true),
    clarificationQuestion: z.string().min(5).max(200)
  }),
  z.object({
    needsClarification: z.literal(false),
    sql: z.string().min(10).max(2000),
    chartSpec: ChartSpecRawSchema,
    assumptions: z.array(z.string()).optional()
  })
])

export type PlanResult = z.infer<typeof PlanSchema>
export type ChartSpecResult = z.infer<typeof ChartSpecSchema>
type ChartSpecRaw = z.infer<typeof ChartSpecRawSchema>

export const SuggestQuestionsSchema = z.object({
  questions: z.array(z.string().min(1).max(200)).min(3).max(3)
})

export type SuggestQuestionsResult = z.infer<typeof SuggestQuestionsSchema>

/** Normalize LLM output (xKey/yKey, encoding, or top-level x/y) into ChartSpec. */
export function normalizeChartSpec(raw: ChartSpecRaw): ChartSpecResult {
  const xKey = raw.xKey ?? raw.encoding?.x?.field ?? raw.x?.field ?? ''
  const yKey = raw.yKey ?? raw.encoding?.y?.field ?? raw.y?.field ?? ''
  if (!xKey || !yKey) {
    throw new Error('chartSpec missing x or y field')
  }
  return {
    type: raw.type,
    title: raw.title?.trim() && raw.title.length > 0 ? raw.title : 'Chart',
    xKey,
    yKey,
    seriesName: raw.seriesName,
    maxCategories: raw.maxCategories,
    otherLabel: raw.otherLabel,
    timeBucket: raw.timeBucket
  }
}
