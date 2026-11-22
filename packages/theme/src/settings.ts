import { globalKey, type StoreSpec } from '@werewolf/storage'
import { isDarkTheme, themeColorOf, type ThemeName } from './palette.ts'

/** `system` follows the OS: Night when dark, Light otherwise. */
export const THEME_MODES = ['system', 'night', 'storm', 'light'] as const
export type ThemeMode = (typeof THEME_MODES)[number]

export interface ThemeSettings {
  mode: ThemeMode
}

export const DEFAULT_THEME: ThemeSettings = { mode: 'system' }

/** Shared by every tool; other open apps follow through the `storage` event. */
export const THEME_KEY = globalKey('theme')

export function normalizeTheme(value: unknown): ThemeSettings {
  const mode = (value as { mode?: unknown } | null)?.mode
  return THEME_MODES.includes(mode as ThemeMode) ? { mode: mode as ThemeMode } : DEFAULT_THEME
}

export const THEME_STORE: StoreSpec<ThemeSettings> = {
  key: THEME_KEY,
  version: 1,
  parse: normalizeTheme,
  fallback: () => DEFAULT_THEME,
}

export const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)'

export function resolveTheme(mode: ThemeMode, prefersDark: boolean): ThemeName {
  return mode === 'system' ? (prefersDark ? 'night' : 'light') : mode
}

/** Sets `<html data-theme>`, `color-scheme` and `<meta name="theme-color">`. */
export function applyTheme(mode: ThemeMode, doc: Document = document): ThemeName {
  const prefersDark = doc.defaultView?.matchMedia?.(PREFERS_DARK_QUERY).matches ?? false
  const theme = resolveTheme(mode, prefersDark)
  doc.documentElement.dataset.theme = theme
  doc.documentElement.style.colorScheme = isDarkTheme(theme) ? 'dark' : 'light'
  let meta = doc.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = doc.createElement('meta')
    meta.name = 'theme-color'
    doc.head.append(meta)
  }
  meta.content = themeColorOf(theme)
  return theme
}
