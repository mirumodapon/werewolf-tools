import { describe, expect, it } from 'vite-plus/test'
import { newId, randomUint32, secureRandomInt } from './random.ts'

describe('random', () => {
  it('falls back without Web Crypto', () => {
    expect(randomUint32({})).toBeGreaterThanOrEqual(0)
    expect(newId({})).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })

  it('stays in range and rejects bad bounds', () => {
    for (let i = 0; i < 50; i++) expect(secureRandomInt(3)).toBeLessThan(3)
    expect(() => secureRandomInt(0)).toThrow(RangeError)
  })

  it('rejects values that would bias the result', () => {
    const values = [2 ** 32 - 1, 5]
    const c = { getRandomValues: (b: Uint32Array) => ((b[0] = values.shift()!), b) }
    expect(secureRandomInt(3, c)).toBe(2)
  })
})
