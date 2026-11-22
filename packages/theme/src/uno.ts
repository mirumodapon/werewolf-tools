import type { IconifyJSON } from '@iconify/types'
import { definePreset, presetIcons, presetWind4, type Preset, type UserConfig } from 'unocss'
import { cssVar, FACTION_COLORS, themeCss } from './css.ts'
import { ACCENT_NAMES, NEUTRAL_NAMES } from './palette.ts'

const v = (name: string) => `var(${cssVar(name)})`

/**
 * Tokyo Night for UnoCSS. The palette is emitted once as variables and every theme color
 * refers to a variable, so switching `data-theme` recolors without new CSS. Classes:
 * `bg-bg`, `text-fg`, `text-red`, `border-border`, `bg-wolf/15`…
 */
export const presetTokyoNight = definePreset((): Preset => ({
  name: 'werewolf:tokyo-night',
  theme: {
    colors: Object.fromEntries(
      [...NEUTRAL_NAMES, ...ACCENT_NAMES, ...Object.keys(FACTION_COLORS)].map((c) => [c, v(c)]),
    ),
  },
  preflights: [
    {
      getCSS: () => `${themeCss()}
html { background: ${v('bg')}; color: ${v('fg')}; -webkit-tap-highlight-color: transparent; scrollbar-color: ${v('border')} transparent; accent-color: ${v('purple')}; caret-color: ${v('purple')}; }
body { margin: 0; min-height: 100dvh; font-family: system-ui, -apple-system, 'PingFang TC', 'Noto Sans TC', sans-serif; }
button, input, textarea, select { font: inherit; color: inherit; }
input::placeholder, textarea::placeholder { color: ${v('comment')}; opacity: 1; }
input:focus, textarea:focus { outline: none; border-color: ${v('purple')}; }
:focus-visible { outline: 2px solid ${v('purple')}; outline-offset: 2px; }
::selection { background: color-mix(in srgb, ${v('purple')} 35%, transparent); }
.no-select { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }`,
    },
  ],
}))

/**
 * The UnoCSS config of every app: Wind4, Tabler icons (the only icon set) and Tokyo Night.
 * Workspace `.ts` files are scanned too, so classes written in shared code are generated;
 * pass `safelist` for classes only built at runtime.
 */
export function werewolfUnoConfig({ safelist = [] }: { safelist?: string[] } = {}): UserConfig {
  return {
    // Classes built at runtime (e.g. a tool's icon from the registry) that no file spells out.
    safelist,
    presets: [
      presetWind4({ preflights: { reset: true } }),
      presetIcons({
        collections: {
          tabler: () =>
            import('@iconify-json/tabler/icons.json', { with: { type: 'json' } }).then(
              (m) => m.default as IconifyJSON,
            ),
        },
        extraProperties: { display: 'inline-block', 'vertical-align': 'middle' },
      }),
      presetTokyoNight(),
    ],
    content: {
      pipeline: {
        include: [/\.(vue|ts|html)($|\?)/],
        exclude: [/[\\/]node_modules[\\/]/, /[\\/]dist[\\/]/],
      },
    },
  }
}
