/**
 * Share links: a JSON value, base64url encoded (deflate-raw compressed when that is
 * shorter), in one query parameter (`/deal/?b=…`, `/judge/?s=…`). Each tool validates
 * what it decodes and keeps its values compact (arrays of numbers, not objects).
 */

export class ShareError extends Error {
  override name = 'ShareError'
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new ShareError('not base64url')
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

async function through(bytes: Uint8Array, stream: ReadableWritablePair<Uint8Array, BufferSource>) {
  const writer = stream.writable.getWriter()
  // A corrupt payload fails when reading below; these promises would only repeat it.
  writer.write(bytes as BufferSource).catch(() => {})
  writer.close().catch(() => {})
  return new Uint8Array(await new Response(stream.readable).arrayBuffer())
}

/**
 * The value as a link payload: `z` + deflate-raw + base64url, or `j` + base64url of the
 * JSON itself when that is shorter (small values grow when compressed).
 */
export async function encodePayload(value: unknown): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(value))
  const plain = `j${toBase64Url(json)}`
  const packed = `z${toBase64Url(await through(json, new CompressionStream('deflate-raw')))}`
  return packed.length < plain.length ? packed : plain
}

/** The JSON value in a payload; throws ShareError when it is unreadable. */
export async function decodePayload(payload: string): Promise<unknown> {
  try {
    const body = fromBase64Url(payload.slice(1))
    const bytes =
      payload[0] === 'z'
        ? await through(body, new DecompressionStream('deflate-raw'))
        : payload[0] === 'j'
          ? body
          : null
    if (!bytes) throw new ShareError('unknown payload kind')
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    throw new ShareError('unreadable payload')
  }
}

/** `base` (any URL of the tool) with only `?<param>=<payload>`. */
export function shareUrl(base: string, param: string, payload: string): string {
  const url = new URL(base)
  url.hash = ''
  url.search = new URLSearchParams({ [param]: payload }).toString()
  return url.toString()
}

/**
 * Takes `param` out of the page's query string, leaving a clean address (so a reload does
 * not import twice), and returns its value.
 */
export function takeQueryParam(param: string, loc: Location = location): string | null {
  const params = new URLSearchParams(loc.search)
  const value = params.get(param)
  if (value === null) return null
  params.delete(param)
  const rest = params.toString()
  history.replaceState(history.state, '', `${loc.pathname}${rest ? `?${rest}` : ''}${loc.hash}`)
  return value
}
