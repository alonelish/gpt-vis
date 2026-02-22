import type { ChartSpec } from './types'

const MAX_BAR = 30
const MAX_LINE_POINTS = 2000

export function shapeChartData(
  data: Record<string, unknown>[],
  chartSpec: ChartSpec
): Record<string, unknown>[] {
  const { type, xKey, yKey, maxCategories = 10, otherLabel = 'Other' } = chartSpec
  if (data.length === 0) return data

  switch (type) {
    case 'pie': {
      const num = Math.min(data.length, maxCategories)
      const sorted = [...data].sort((a, b) => {
        const va = Number(a[yKey] ?? 0)
        const vb = Number(b[yKey] ?? 0)
        return vb - va
      })
      const top = sorted.slice(0, num)
      if (sorted.length <= num) return top
      const rest = sorted.slice(num)
      const remainder = rest.reduce((s, r) => s + Number(r[yKey] ?? 0), 0)
      return [...top, { [xKey]: otherLabel, [yKey]: remainder }]
    }
    case 'bar':
      return data.slice(0, MAX_BAR)
    case 'line':
      return data.slice(0, MAX_LINE_POINTS)
    case 'histogram':
    case 'table':
    default:
      return data
  }
}
