<script setup lang="ts">
const emit = defineEmits<{
  uploaded: [id: string, rowCount: number]
}>()
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const error = ref<string | null>(null)

async function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.csv')) {
    error.value = 'Please select a CSV file'
    return
  }
  error.value = null
  uploading.value = true
  try {
    const form = new FormData()
    form.append('file', file)
    const res = await $fetch<{ id: string, rowCount: number }>('/api/datasets', {
      method: 'POST',
      body: form
    })
    emit('uploaded', res.id, res.rowCount)
    target.value = ''
  } catch (err: unknown) {
    error.value = err && typeof err === 'object' && 'data' in err && typeof (err as { data: { message?: string } }).data?.message === 'string'
      ? (err as { data: { message: string } }).data.message
      : 'Upload failed'
  } finally {
    uploading.value = false
  }
}

function triggerUpload() {
  fileInput.value?.click()
}
</script>

<template>
  <div class="rounded-lg border border-default p-4">
    <h2 class="text-lg font-semibold mb-2">
      Upload CSV
    </h2>
    <input
      ref="fileInput"
      type="file"
      accept=".csv"
      class="hidden"
      @change="onFileChange"
    >
    <UButton
      :loading="uploading"
      :disabled="uploading"
      @click="triggerUpload"
    >
      {{ uploading ? 'Uploading…' : 'Choose CSV file' }}
    </UButton>
    <p v-if="error" class="mt-2 text-sm text-red-500">
      {{ error }}
    </p>
  </div>
</template>
