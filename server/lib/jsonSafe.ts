/**
 * Recursively replace BigInt with number so the result is JSON-serializable.
 */
export function jsonSafe<T>(value: T): T {
  if (typeof value === 'bigint') {
    return Number(value) as T
  }
  if (Array.isArray(value)) {
    return value.map((item) => jsonSafe(item)) as T
  }
  if (value != null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = jsonSafe(v)
    }
    return out as T
  }
  return value
}
