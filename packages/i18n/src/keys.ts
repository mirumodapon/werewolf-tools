/** Dotted keys of a message tree, e.g. `roles.seer.name` (for check-i18n). */
export function flattenKeys(messages: unknown, prefix = ''): string[] {
  if (typeof messages !== 'object' || messages === null) return [prefix]
  return Object.entries(messages).flatMap(([k, v]) => flattenKeys(v, prefix ? `${prefix}.${k}` : k))
}

export function keyDifferences(a: unknown, b: unknown): { onlyA: string[]; onlyB: string[] } {
  const ka = new Set(flattenKeys(a))
  const kb = new Set(flattenKeys(b))
  return { onlyA: [...ka].filter((k) => !kb.has(k)), onlyB: [...kb].filter((k) => !ka.has(k)) }
}
