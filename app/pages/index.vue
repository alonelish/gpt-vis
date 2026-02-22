<script setup lang="ts">
const datasetId = ref<string | null>(null)
const rowCount = ref<number | null>(null)

function onUploaded(id: string, count: number) {
  datasetId.value = id
  rowCount.value = count
}
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-4xl">
    <h1 class="text-2xl font-bold mb-6">
      CSV QA + Visualization
    </h1>
    <div class="grid gap-6 md:grid-cols-1">
      <UploadPanel @uploaded="onUploaded" />
      <div v-if="datasetId" class="text-sm text-muted">
        Dataset loaded ({{ rowCount?.toLocaleString() ?? 0 }} rows). Ask a question below.
      </div>
      <ChatPanel :dataset-id="datasetId" />
    </div>
  </div>
</template>
