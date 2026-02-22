export type ChartType = 'bar' | 'line' | 'pie' | 'histogram' | 'table'

export interface ChartSpec {
  type: ChartType
  title: string
  xKey: string
  yKey: string
  seriesName?: string
  maxCategories?: number
  otherLabel?: string
  timeBucket?: 'hour' | 'day' | 'week' | 'month'
}

export interface ChatResponseSuccess {
  answerText: string
  sql: string
  data: Record<string, unknown>[]
  chartSpec: ChartSpec
  warnings?: string[]
}

export interface ChatResponseClarification {
  clarificationQuestion: string
}

export type ChatResponse = ChatResponseSuccess | ChatResponseClarification

export function isClarification(r: ChatResponse): r is ChatResponseClarification {
  return 'clarificationQuestion' in r && !('answerText' in r)
}
