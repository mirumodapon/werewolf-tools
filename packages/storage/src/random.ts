/**
 * Randomness that still works on old phones: `crypto.randomUUID` needs iOS 15.4 and
 * HTTPS, `crypto.getRandomValues` can be missing too. Each falls back instead of throwing.
 */
interface CryptoLike {
  getRandomValues?: (buffer: Uint32Array) => Uint32Array
  randomUUID?: () => string
}

export function getCrypto(): CryptoLike | undefined {
  try {
    return globalThis.crypto as CryptoLike | undefined
  } catch {
    return undefined
  }
}

export function randomUint32(c: CryptoLike | undefined = getCrypto()): number {
  if (typeof c?.getRandomValues === 'function') {
    try {
      return c.getRandomValues(new Uint32Array(1))[0]!
    } catch {
      // Fall back to Math.random.
    }
  }
  return Math.floor(Math.random() * 2 ** 32)
}

/** Uniform integer in [0, max), without modulo bias. */
export function secureRandomInt(max: number, c: CryptoLike | undefined = getCrypto()): number {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) throw new RangeError(`max: ${max}`)
  const limit = 2 ** 32 - (2 ** 32 % max)
  for (;;) {
    const n = randomUint32(c)
    if (n < limit) return n % max
  }
}

/** A v4 UUID for records and custom boards. */
export function newId(c: CryptoLike | undefined = getCrypto()): string {
  if (typeof c?.randomUUID === 'function') {
    try {
      return c.randomUUID()
    } catch {
      // Build one from random numbers below.
    }
  }
  const bytes: number[] = []
  for (let i = 0; i < 4; i++) {
    const n = randomUint32(c)
    bytes.push(n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255)
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
