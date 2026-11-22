/**
 * Share links: a JSON value, deflate-raw compressed and base64url encoded, in one query
 * parameter (`/deal/?b=…`, `/judge/?s=…`). Each tool validates what it decodes.
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

export async function encodePayload(value: unknown): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(value))
  return toBase64Url(await through(json, new CompressionStream('deflate-raw')))
}

/** The JSON value in a payload; throws ShareError when it is unreadable. */
export async function decodePayload(payload: string): Promise<unknown> {
  try {
    const bytes = await through(fromBase64Url(payload), new DecompressionStream('deflate-raw'))
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
