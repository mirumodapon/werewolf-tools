import { PALETTE } from '@werewolf/theme'
import type { ExportDoc, Tone } from '../useGameExport.ts'

const WIDTH = 1080
const PAD = 64
const FONT = `system-ui, -apple-system, 'PingFang TC', 'Noto Sans TC', sans-serif`
const C = PALETTE.night
const TONE: Record<Tone | 'normal', string> = {
  normal: C.fg,
  death: C.red,
  end: C.green,
  muted: C.subtle,
}

/** Breaks a line into pieces that fit `max` pixels (CJK breaks anywhere; words stay whole). */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const out: string[] = []
  let line = ''
  for (const token of text.match(/[\x21-\x7e]+|\s|./gu) ?? []) {
    if (line && ctx.measureText(line + token).width > max) {
      out.push(line.trimEnd())
      line = token.trimStart()
    } else {
      line += token
    }
  }
  if (line) out.push(line)
  return out.length ? out : ['']
}

type Row = { text: string; font: string; color: string; height: number; gap: number }

/**
 * Draws the export as a tall PNG in Tokyo Night colors, with the browser's canvas (no
 * library). Throws when the browser cannot draw.
 */
export async function renderImage(doc: ExportDoc, footer: string): Promise<Blob> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas is not available')
  const max = WIDTH - PAD * 2
  const rows: Row[] = []
  const add = (text: string, size: number, weight: number, color: string, gap = 0) => {
    const font = `${weight} ${size}px ${FONT}`
    ctx.font = font
    for (const [i, piece] of wrap(ctx, text, max).entries())
      rows.push({ text: piece, font, color, height: size * 1.45, gap: i === 0 ? gap : 0 })
  }
  add(doc.title, 52, 700, C.fg)
  for (const s of doc.sections) {
    if (s.title) add(s.title, 34, 700, C.purple, 36)
    else rows.push({ text: '', font: '', color: '', height: 0, gap: 20 })
    for (const l of s.lines) add(l.text, 30, 400, TONE[l.tone ?? 'normal'])
  }
  add(footer, 24, 400, C.comment, 48)

  const height = PAD * 2 + rows.reduce((h, r) => h + r.height + r.gap, 0)
  canvas.width = WIDTH
  canvas.height = Math.ceil(height)
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, WIDTH, canvas.height)
  ctx.textBaseline = 'top'
  let y = PAD
  for (const r of rows) {
    y += r.gap
    if (r.text) {
      ctx.font = r.font
      ctx.fillStyle = r.color
      ctx.fillText(r.text, PAD, y)
    }
    y += r.height
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('no image'))), 'image/png'),
  )
}
