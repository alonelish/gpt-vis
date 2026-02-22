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

export const PlanSchema = z.union([
  z.object({
    needsClarification: z.literal(true),
    clarificationQuestion: z.string().min(5).max(200)
  }),
  z.object({
    needsClarification: z.literal(false),
    sql: z.string().min(10).max(2000),
    chartSpec: ChartSpecSchema,
    assumptions: z.array(z.string()).optional()
  })
])

export type PlanResult = z.infer<typeof PlanSchema>
export type ChartSpecResult = z.infer<typeof ChartSpecSchema>
