import { PALETTE, type AccentName } from '@werewolf/theme'

export const ICON_BACKGROUND = PALETTE.night.bg

const SIZE = 512
/** Half the canvas: well inside the maskable safe zone. */
const GLYPH = 256

/** An app icon from a 24×24 Tabler icon body: accent glyph on a soft disc, full-bleed. */
export function iconSvg(body: string, accent: AccentName): string {
  const color = PALETTE.night[accent]
  const offset = (SIZE - GLYPH) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${ICON_BACKGROUND}"/>
  <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="176" fill="${color}" opacity="0.14"/>
  <g transform="translate(${offset} ${offset}) scale(${GLYPH / 24})" color="${color}">${body.replace(/currentColor/g, color)}</g>
</svg>
`
}
