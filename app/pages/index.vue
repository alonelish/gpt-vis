<script setup lang="ts">
import type { ChatResponse, ChatResponseSuccess } from '~/types'
import { isClarification } from '~/types'

type Message = {
  role: 'user' | 'assistant'
  text: string
  sql?: string
  chartSpec?: ChatResponseSuccess['chartSpec']
  data?: ChatResponseSuccess['data']
  warnings?: string[]
  suggestedQuestions?: string[]
}

const datasetId = ref<string | null>(null)
const rowCount = ref<number | null>(null)
const fileName = ref<string | null>(null)
const messages = ref<Message[]>([])
const inputText = ref('')
const loading = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const messagesEnd = ref<HTMLElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

function hasRealMessages(): boolean {
  return messages.value.some((m) => m.role === 'user' || (m.role === 'assistant' && m.suggestedQuestions == null))
}

async function handleUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.csv')) {
    messages.value.push({
      role: 'assistant',
      text: 'Please select a CSV file.'
    })
    scrollToBottom()
    target.value = ''
    return
  }
  uploading.value = true
  try {
    const form = new FormData()
    form.append('file', file)
    const res = await $fetch<{ id: string; rowCount: number }>('/api/datasets', {
      method: 'POST',
      body: form
    })
    datasetId.value = res.id
    rowCount.value = res.rowCount
    fileName.value = file.name
    messages.value = []
    target.value = ''
    loading.value = true
    scrollToBottom()
    try {
      const suggestRes = await $fetch<{ questions: string[] }>(
        `/api/datasets/${res.id}/suggest-questions`,
        { method: 'POST' }
      )
      messages.value.push({
        role: 'assistant',
        text: 'What would you like to ask?',
        suggestedQuestions: suggestRes.questions
      })
    } catch (suggestErr: unknown) {
      const suggestMsg =
        suggestErr &&
        typeof suggestErr === 'object' &&
        'data' in suggestErr &&
        typeof (suggestErr as { data: { message?: string } }).data?.message === 'string'
          ? (suggestErr as { data: { message: string } }).data.message
          : 'Could not load suggestions'
      messages.value.push({ role: 'assistant', text: suggestMsg })
    } finally {
      loading.value = false
      scrollToBottom()
    }
  } catch (err: unknown) {
    const msg =
      err &&
      typeof err === 'object' &&
      'data' in err &&
      typeof (err as { data: { message?: string } }).data?.message === 'string'
        ? (err as { data: { message: string } }).data.message
        : 'Upload failed'
    messages.value.push({ role: 'assistant', text: msg })
    scrollToBottom()
  } finally {
    uploading.value = false
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

function setQuestionAndSubmit(question: string) {
  submit(question)
}

async function submit(questionOverride?: string) {
  const text = (questionOverride ?? inputText.value).trim()
  if (questionOverride) inputText.value = ''

  if (!datasetId.value) {
    messages.value.push({
      role: 'assistant',
      text: 'Upload a CSV file to ask questions about it.'
    })
    inputText.value = ''
    scrollToBottom()
    return
  }

  if (text) {
    messages.value.push({ role: 'user', text })
    if (!questionOverride) inputText.value = ''
    loading.value = true
    scrollToBottom()
    try {
      const res = await $fetch<ChatResponse>('/api/chat', {
        method: 'POST',
        body: { datasetId: datasetId.value, question: text }
      })
      if (isClarification(res)) {
        messages.value.push({ role: 'assistant', text: res.clarificationQuestion })
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
      const msg =
        err &&
        typeof err === 'object' &&
        'data' in err &&
        typeof (err as { data: { message?: string } }).data?.message === 'string'
          ? (err as { data: { message: string } }).data.message
          : 'Request failed'
      messages.value.push({ role: 'assistant', text: msg })
    } finally {
      loading.value = false
      scrollToBottom()
    }
    return
  }

  if (!hasRealMessages()) {
    const alreadyHasSuggestions = messages.value.some((m) => m.suggestedQuestions?.length)
    if (alreadyHasSuggestions) {
      scrollToBottom()
      return
    }
    loading.value = true
    scrollToBottom()
    try {
      const res = await $fetch<{ questions: string[] }>(
        `/api/datasets/${datasetId.value}/suggest-questions`,
        { method: 'POST' }
      )
      messages.value.push({
        role: 'assistant',
        text: 'What would you like to ask?',
        suggestedQuestions: res.questions
      })
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === 'object' &&
        'data' in err &&
        typeof (err as { data: { message?: string } }).data?.message === 'string'
          ? (err as { data: { message: string } }).data.message
          : 'Could not load suggestions'
      messages.value.push({ role: 'assistant', text: msg })
    } finally {
      loading.value = false
      scrollToBottom()
    }
  }
}

function onEnter(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0 w-full max-w-3xl mx-auto h-full">
    <div class="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="flex"
        :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="rounded-2xl px-4 py-3 max-w-[85%]"
          :class="
            msg.role === 'user'
              ? 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100'
              : 'bg-muted/60'
          "
        >
          <p class="text-sm font-medium mb-4">
            {{ msg.role === 'user' ? 'You' : 'Assistant' }}
          </p>
          <ClientOnly>
            <ChartRenderer
              v-if="msg.role === 'assistant' && msg.chartSpec && msg.data && msg.data.length > 0"
              :data="msg.data"
              :chart-spec="msg.chartSpec"
              class="mt-4 min-h-[360px]"
            />
            <template #fallback>
              <div
                v-if="msg.role === 'assistant' && msg.chartSpec && msg.data?.length"
                class="mt-4 mb-5 min-h-[360px] rounded bg-black/5 dark:bg-white/5 flex items-center justify-center text-sm opacity-70"
              >
                Loading chart…
              </div>
            </template>
          </ClientOnly>
          <p class="text-sm whitespace-pre-wrap mt-2">
            {{ msg.text }}
          </p>
          <ul
            v-if="msg.suggestedQuestions?.length"
            class="mt-4 list-disc list-inside space-y-1.5 text-sm"
          >
            <li
              v-for="(q, j) in msg.suggestedQuestions"
              :key="j"
              class="cursor-pointer hover:underline text-green-600 dark:text-green-400"
              :class="loading ? 'pointer-events-none opacity-60 cursor-not-allowed' : ''"
              @click="!loading && setQuestionAndSubmit(q)"
            >
              {{ q }}
            </li>
          </ul>
          <p
            v-if="msg.suggestedQuestions?.length"
            class="text-sm mt-3 opacity-80"
          >
            Or, ask your own questions below…
          </p>
          <p v-if="msg.warnings?.length" class="text-xs mt-3 opacity-80">
            {{ msg.warnings.join(' ') }}
          </p>
        </div>
      </div>
      <div v-if="loading" class="flex justify-start">
        <div class="rounded-2xl px-4 py-3 bg-muted/60 flex items-center gap-2">
          <UIcon name="i-lucide-loader-2" class="size-4 animate-spin opacity-70" />
          <p class="text-sm opacity-70">Thinking…</p>
        </div>
      </div>
      <div ref="messagesEnd" />
    </div>

    <div class="sticky bottom-0 shrink-0 px-4 pb-6 pt-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div
        class="flex items-center gap-3 rounded-2xl border border-default bg-muted/30 px-4 py-4 focus-within:ring-2 focus-within:ring-primary/50"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".csv"
          class="hidden"
          @change="handleUpload"
        >
        <UButton
          icon="i-lucide-file-spreadsheet"
          color="neutral"
          variant="ghost"
          size="lg"
          :loading="uploading"
          :disabled="loading"
          aria-label="Upload CSV"
          class="[&_svg]:size-6"
          @click="triggerFileInput"
        />
        <span
          v-if="fileName"
          class="text-xs text-muted truncate max-w-[8rem]"
          :title="fileName"
        >
          {{ fileName }}
        </span>
        <input
          v-model="inputText"
          type="text"
          class="flex-1 min-w-0 bg-transparent border-0 outline-none px-2 py-2 text-sm placeholder:text-muted"
          placeholder="Ask about your data…"
          :disabled="loading"
          @keydown="onEnter"
        >
        <UButton
          icon="i-lucide-send"
          color="primary"
          variant="ghost"
          size="md"
          :disabled="loading || uploading"
          aria-label="Send"
          @click="() => submit()"
        />
      </div>
    </div>
  </div>
</template>
