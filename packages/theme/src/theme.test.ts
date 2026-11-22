import { beforeEach, describe, expect, it } from 'vite-plus/test'
import {
  applyTheme,
  normalizeTheme,
  PALETTE,
  resolveTheme,
  themeBootstrapScript,
  themeCss,
  THEME_KEY,
} from './index.ts'

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('uses the Tokyo Night colors', () => {
    expect(PALETTE.night.bg).toBe('#1a1b26')
    expect(PALETTE.storm.bg).toBe('#24283b')
    expect(PALETTE.light.red).toBe('#8c4351')
  })

  it('emits variables for every theme and faction', () => {
    const css = themeCss()
    expect(css).toContain("[data-theme='storm']")
    expect(css).toContain('--tn-wolf: var(--tn-red);')
  })

  it('resolves system against the OS', () => {
    expect(resolveTheme('system', true)).toBe('night')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('storm', false)).toBe('storm')
  })

  it('normalizes stored values', () => {
    expect(normalizeTheme({ mode: 'storm' })).toEqual({ mode: 'storm' })
    expect(normalizeTheme({ mode: 'pink' })).toEqual({ mode: 'system' })
  })

  it('applies a theme to the document', () => {
    applyTheme('storm')
    expect(document.documentElement.dataset.theme).toBe('storm')
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
      '#24283b',
    )
  })

  it('bootstrap script applies the stored theme', () => {
    localStorage.setItem(THEME_KEY, JSON.stringify({ version: 1, data: { mode: 'light' } }))
    new Function(themeBootstrapScript())()
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
