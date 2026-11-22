import { ACCENT_NAMES, NEUTRAL_NAMES, PALETTE, THEME_NAMES, isDarkTheme } from './palette.ts'

export const cssVar = (name: string) => `--tn-${name}`

/** 狼人 red, 神職 blue, 村民 green, 第三方 yellow. */
export const FACTION_COLORS = {
  wolf: 'red',
  god: 'blue',
  village: 'green',
  third: 'yellow',
} as const

/** One block of variables per theme on `<html data-theme>`; Night is the default. */
export function themeCss(): string {
  return `${THEME_NAMES.map((theme) => {
    const selector = theme === 'night' ? `:root, [data-theme='night']` : `[data-theme='${theme}']`
    const colors = [...NEUTRAL_NAMES, ...ACCENT_NAMES].map(
      (c) => `  ${cssVar(c)}: ${PALETTE[theme][c]};`,
    )
    const factions = Object.entries(FACTION_COLORS).map(
      ([f, c]) => `  ${cssVar(f)}: var(${cssVar(c)});`,
    )
    const scheme = isDarkTheme(theme) ? 'dark' : 'light'
    return `${selector} {\n  color-scheme: ${scheme};\n${[...colors, ...factions].join('\n')}\n}`
  }).join('\n')}\n`
}
