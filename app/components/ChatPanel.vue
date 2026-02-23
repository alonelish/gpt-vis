<script setup lang="ts">
import type { ChatResponse, ChatResponseSuccess } from '~/types'
import { isClarification } from '~/types'

const props = defineProps<{
  datasetId: string | null
}>()

const question = ref('')
const loading = ref(false)
const messages = ref<Array<{ role: 'user' | 'assistant', text: string, sql?: string, chartSpec?: ChatResponseSuccess['chartSpec'], data?: ChatResponseSuccess['data'], warnings?: string[] }>>([])
const clarificationQuestion = ref<string | null>(null)

async function submit() {
  const q = question.value.trim()
  if (!q || !props.datasetId) return
  messages.value.push({ role: 'user', text: q })
  question.value = ''
  loading.value = true
  clarificationQuestion.value = null
  try {
    const res = await $fetch<ChatResponse>('/api/chat', {
      method: 'POST',
      body: { datasetId: props.datasetId, question: q }
    })
    if (isClarification(res)) {
      clarificationQuestion.value = res.clarificationQuestion
      messages.value.push({
        role: 'assistant',
        text: res.clarificationQuestion
      })
    } else {
      messages.value.push({
        role: 'assistant',
        text: res.answerText,
        sql: res.sql,
        chartSpec: res.chartSpec,
        data: res.data,
        warnings: res.warnings
      })
    }
  } catch (err: unknown) {
    const msg = err && typeof err === 'object' && 'data' in err && typeof (err as { data: { message?: string } }).data?.message === 'string'
      ? (err as { data: { message: string } }).data.message
      : 'Request failed'
    messages.value.push({ role: 'assistant', text: msg })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 rounded-lg border border-default p-4">
    <h2 class="text-lg font-semibold">
      Ask about your data
    </h2>
    <p v-if="!datasetId" class="text-muted text-sm">
      Upload a CSV above to get started.
    </p>
    <template v-else>
      <form class="flex gap-2" @submit.prevent="submit">
        <UInput
          v-model="question"
          placeholder="e.g. Show total sales by country as a pie chart"
          class="flex-1"
          :disabled="loading"
          @keydown.enter.prevent="submit"
        />
        <UButton type="submit" :loading="loading" :disabled="loading">
          Ask
        </UButton>
      </form>
      <div class="space-y-4 max-h-[60vh] overflow-y-auto">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="rounded p-3"
          :class="msg.role === 'user' ? 'bg-primary/10' : 'bg-muted/50'"
        >
          <p class="font-medium text-sm mb-1">
            {{ msg.role === 'user' ? 'You' : 'Assistant' }}
          </p>
          <p class="text-sm whitespace-pre-wrap">
            {{ msg.text }}
          </p>
          <details v-if="msg.sql" class="mt-2">
            <summary class="text-xs text-muted cursor-pointer">
              Show SQL
            </summary>
            <pre class="text-xs bg-muted p-2 rounded overflow-x-auto mt-1">{{ msg.sql }}</pre>
          </details>
          <div v-if="msg.warnings?.length" class="text-xs text-amber-600 mt-1">
            {{ msg.warnings.join(' ') }}
          </div>
          <ClientOnly>
            <ChartRenderer
              v-if="msg.chartSpec && msg.data && msg.data.length > 0"
              :data="msg.data"
              :chart-spec="msg.chartSpec"
              class="mt-3 min-h-[200px]"
            />
            <template #fallback>
              <div v-if="msg.chartSpec && msg.data?.length" class="mt-3 min-h-[200px] rounded bg-muted/30 flex items-center justify-center text-muted text-sm">
                Loading chart…
              </div>
            </template>
          </ClientOnly>
        </div>
      </div>
    </template>
  </div>
</template>
