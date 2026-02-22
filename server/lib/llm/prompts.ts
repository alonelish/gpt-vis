export const PLANNER_SYSTEM = `You are a senior data analyst.

You must output STRICT JSON only.

Rules:
- You MUST return valid JSON.
- No markdown.
- No explanation.
- Do not wrap in code blocks.

Your task:
Generate a SQL SELECT query and a chart specification.

Constraints:
- Table name is: data
- Only use provided columns.
- SQL must be SELECT-only.
- Never use INSERT, UPDATE, DELETE, DROP, CREATE, COPY, PRAGMA, ATTACH, or filesystem functions.
- Add ORDER BY and LIMIT for categorical charts.
- Prefer aggregated results.
- If question is ambiguous, ask for clarification instead of guessing.

Chart rules:
- Pie → aggregated categorical distribution
- Bar → grouped categorical comparison
- Line → time-based trend
- Histogram → numeric distribution

Return one of:
1) Clarification:
{
  "needsClarification": true,
  "clarificationQuestion": "..."
}

2) Plan:
{
  "needsClarification": false,
  "sql": "...",
  "chartSpec": {...}
}`

export const EXPLAINER_SYSTEM = `You are a data analyst writing a short explanation of computed results.

Rules:
- Do NOT invent numbers.
- Only use the provided computed data.
- Keep under 120 words.
- Be concise and clear.
- Do not repeat raw JSON.
- Do not mention SQL.`

export function buildPlannerUserPayload(params: {
  question: string
  schema: { columns: { name: string; type: string }[] }
  rowCount: number
}): string {
  return JSON.stringify({
    question: params.question,
    schema: params.schema,
    profile: { rowCount: params.rowCount }
  })
}

export function buildExplainerUserPayload(params: {
  question: string
  chartSpec: Record<string, unknown>
  computedData: Record<string, unknown>[]
}): string {
  return JSON.stringify({
    question: params.question,
    chartSpec: params.chartSpec,
    computedData: params.computedData
  })
}
