/**
 * Tokyo Night (https://wixdaq.github.io/Tokyo-Night-Website/palette.html): the only source
 * of color. CSS variables, UnoCSS, PWA icons and `theme-color` all come from here.
 */
export const THEME_NAMES = ['night', 'storm', 'light'] as const
export type ThemeName = (typeof THEME_NAMES)[number]

export const ACCENT_NAMES = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'cyan',
  'blue',
  'purple',
] as const
export type AccentName = (typeof ACCENT_NAMES)[number]

/** Page background, recessed and raised surfaces, three text levels, comments and borders. */
export const NEUTRAL_NAMES = [
  'bg',
  'surface',
  'raised',
  'fg',
  'muted',
  'subtle',
  'comment',
  'border',
] as const
export type NeutralName = (typeof NEUTRAL_NAMES)[number]
export type ColorName = NeutralName | AccentName

const DARK_ACCENTS: Record<AccentName, string> = {
  red: '#f7768e',
  orange: '#ff9e64',
  yellow: '#e0af68',
  green: '#9ece6a',
  teal: '#73daca',
  cyan: '#2ac3de',
  blue: '#7aa2f7',
  purple: '#bb9af7',
}

export const PALETTE: Record<ThemeName, Record<ColorName, string>> = {
  night: {
    bg: '#1a1b26',
    surface: '#16161e',
    raised: '#24283b',
    fg: '#c0caf5',
    muted: '#a9b1d6',
    subtle: '#9aa5ce',
    comment: '#565f89',
    border: '#414868',
    ...DARK_ACCENTS,
  },
  storm: {
    bg: '#24283b',
    surface: '#1f2335',
    raised: '#292e42',
    fg: '#c0caf5',
    muted: '#a9b1d6',
    subtle: '#9aa5ce',
    comment: '#565f89',
    border: '#414868',
    ...DARK_ACCENTS,
  },
  light: {
    bg: '#e6e7ed',
    surface: '#d6d8df',
    raised: '#f0f0f4',
    fg: '#343b58',
    muted: '#40434f',
    subtle: '#4c505e',
    comment: '#6c6e75',
    border: '#a8aecb',
    red: '#8c4351',
    orange: '#965027',
    yellow: '#8f5e15',
    green: '#385f0d',
    teal: '#33635c',
    cyan: '#006c86',
    blue: '#2959aa',
    purple: '#5a3e8e',
  },
}

export const isDarkTheme = (theme: ThemeName) => theme !== 'light'

/** `<meta name="theme-color">`: the theme's background. */
export const themeColorOf = (theme: ThemeName) => PALETTE[theme].bg
