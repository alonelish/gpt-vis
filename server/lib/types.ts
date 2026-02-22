export type ChartType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'histogram'
  | 'table'

export type ChartSpec = {
  type: ChartType
  title: string
  xKey: string
  yKey: string
  seriesName?: string
  maxCategories?: number
  otherLabel?: string
  timeBucket?: 'hour' | 'day' | 'week' | 'month'
}

export type SchemaColumn = {
  name: string
  type: string
}

export type DatasetMeta = {
  id: string
  filePath: string
  dbPath: string
  schema?: { columns: SchemaColumn[] }
  rowCount?: number
  ready: boolean
}

export type ChatRequest = {
  datasetId: string
  question: string
}

export type ChatResponseClarification = {
  clarificationQuestion: string
}

export type ChatResponseSuccess = {
  answerText: string
  sql: string
  data: Record<string, unknown>[]
  chartSpec: ChartSpec
  warnings?: string[]
}

export type ChatResponse = ChatResponseClarification | ChatResponseSuccess

export function isClarification(r: ChatResponse): r is ChatResponseClarification {
  return 'clarificationQuestion' in r && !('answerText' in r)
}
