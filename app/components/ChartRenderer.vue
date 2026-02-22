<script setup lang="ts">
import type { ChartSpec } from '~/types'
import * as echarts from 'echarts'

const props = defineProps<{
  data: Record<string, unknown>[]
  chartSpec: ChartSpec
}>()

const chartEl = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

function buildOption(): echarts.EChartsOption | null {
  const { type, title, xKey, yKey, seriesName } = props.chartSpec
  const data = props.data
  if (!data.length) return null
  const base = { title: { text: title } }
  if (type === 'pie') {
    return {
      ...base,
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        name: seriesName ?? yKey,
        data: data.map((r) => ({ name: String(r[xKey] ?? ''), value: Number(r[yKey] ?? 0) }))
      }]
    }
  }
  if (type === 'bar') {
    return {
      ...base,
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: data.map((r) => String(r[xKey] ?? '')) },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', name: seriesName ?? yKey, data: data.map((r) => Number(r[yKey] ?? 0)) }]
    }
  }
  if (type === 'line') {
    return {
      ...base,
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: data.map((r) => String(r[xKey] ?? '')) },
      yAxis: { type: 'value' },
      series: [{ type: 'line', name: seriesName ?? yKey, data: data.map((r) => Number(r[yKey] ?? 0)) }]
    }
  }
  if (type === 'histogram') {
    return {
      ...base,
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: data.map((r) => String(r[xKey] ?? '')) },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', name: seriesName ?? yKey, data: data.map((r) => Number(r[yKey] ?? 0)) }]
    }
  }
  return null
}

function initChart() {
  if (!chartEl.value || !props.data.length) return
  chart = echarts.init(chartEl.value)
  const opt = buildOption()
  if (opt) chart.setOption(opt)
}

function dispose() {
  chart?.dispose()
  chart = null
}

onMounted(() => {
  nextTick(() => initChart())
  const ro = new ResizeObserver(() => chart?.resize())
  if (chartEl.value) ro.observe(chartEl.value)
  onUnmounted(() => {
    ro.disconnect()
    dispose()
  })
})

watch([() => props.data, () => props.chartSpec], () => {
  nextTick(() => {
    if (chart && chartEl.value) {
      const opt = buildOption()
      if (opt) chart.setOption(opt)
    }
  })
}, { deep: true })
</script>

<template>
  <div v-if="chartSpec.type === 'table'" class="overflow-x-auto">
    <table class="w-full text-sm border border-default">
      <thead>
        <tr class="border-b border-default bg-muted/50">
          <th v-for="key in (data[0] ? Object.keys(data[0]) : [])" :key="key" class="text-left p-2">
            {{ key }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in data" :key="i" class="border-b border-default/50">
          <td v-for="key in (data[0] ? Object.keys(data[0]) : [])" :key="key" class="p-2">
            {{ row[key] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div
    v-else
    ref="chartEl"
    class="w-full min-h-[360px]"
  />
</template>
