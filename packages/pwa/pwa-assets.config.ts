import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

/**
 * Shared by every app (run with `--root apps/<id>`). The source SVG is full-bleed with the
 * glyph inside the safe zone, so maskable and apple icons need no padding.
 */
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0 },
    apple: { ...minimal2023Preset.apple, padding: 0 },
  },
  images: ['public/icon.svg'],
})
