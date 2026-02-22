const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet'

export type Message = { role: 'system' | 'user' | 'assistant'; content: string }

export async function callOpenRouter(messages: Message[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set')
  const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, messages })
  })

  
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${text}`)
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const content = data.choices?.[0]?.message?.content
  if (content == null) throw new Error('OpenRouter returned no content')
  return content
}

export function parseJson<T>(text: string): T {
  const trimmed = text.trim().replace(/^```\w*\n?|\n?```$/g, '')
  return JSON.parse(trimmed) as T
}
