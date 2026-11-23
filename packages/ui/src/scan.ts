import { pwaTools } from '@werewolf/registry'

/** Query parameters our share links carry: board, hand-off, game. */
const LINK_PARAMS = ['b', 't', 's'] as const

/**
 * The address to open for a scanned text when it is one of this suite's share links
 * (`…/deal/?b=`, `…/judge/?t=`, `…/judge/?s=`), on the site in use (`origin`) so links
 * made on the published site also open in development. Null for anything else.
 */
export function toolLinkTarget(text: string, origin: string): string | null {
  let url: URL
  try {
    url = new URL(text.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const tool = pwaTools().find(
    (t) => t.path !== '/' && (url.pathname === t.path || url.pathname === t.path.slice(0, -1)),
  )
  const param = LINK_PARAMS.find((p) => url.searchParams.get(p))
  if (!tool || !param) return null
  return `${origin}${tool.path}?${new URLSearchParams({ [param]: url.searchParams.get(param)! })}`
}

interface DetectedBarcode {
  rawValue: string
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>
}
type BarcodeDetectorClass = new (options: { formats: string[] }) => BarcodeDetectorLike

/** Reads a QR code from a video frame: the browser's detector, else jsQR (loaded on demand). */
export type FrameReader = (video: HTMLVideoElement) => Promise<string | null>

export async function createFrameReader(): Promise<FrameReader> {
  const Native = (globalThis as { BarcodeDetector?: BarcodeDetectorClass }).BarcodeDetector
  if (Native) {
    try {
      const detector = new Native({ formats: ['qr_code'] })
      return async (video) => (await detector.detect(video))[0]?.rawValue ?? null
    } catch {
      // Listed but without QR support: fall through to jsQR.
    }
  }
  const { default: jsQR } = await import('jsqr')
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  return async (video) => {
    if (!ctx || !video.videoWidth) return null
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return (
      jsQR(frame.data, frame.width, frame.height, { inversionAttempts: 'dontInvert' })?.data ?? null
    )
  }
}
