import { ROLE_IDS } from '@werewolf/rules'
import { beforeEach, describe, expect, it } from 'vite-plus/test'
import {
  createWerewolfI18n,
  DEFAULT_LOCALE,
  htmlLang,
  keyDifferences,
  LOCALE_KEY,
  readLocale,
  SHARED_MESSAGES,
  writeLocale,
} from './index.ts'

describe('locale', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to 繁體中文 whatever the browser says', () => {
    expect(DEFAULT_LOCALE).toBe('zh-TW')
    expect(readLocale()).toBe('zh-TW')
  })

  it('remembers the chosen language', () => {
    writeLocale('en-US')
    expect(readLocale()).toBe('en-US')
    localStorage.setItem(LOCALE_KEY, JSON.stringify({ version: 1, data: 'fr' }))
    expect(readLocale()).toBe('zh-TW')
  })

  it('maps to <html lang>', () => {
    expect(htmlLang('zh-TW')).toBe('zh-Hant-TW')
  })
})

describe('messages', () => {
  it('have the same keys in both languages', () => {
    expect(keyDifferences(SHARED_MESSAGES['zh-TW'], SHARED_MESSAGES['en-US'])).toEqual({
      onlyA: [],
      onlyB: [],
    })
  })

  it('name and describe every role', () => {
    const i18n = createWerewolfI18n(undefined, 'zh-TW')
    for (const id of ROLE_IDS) {
      expect(i18n.global.te(`roles.${id}.name`)).toBe(true)
      expect(i18n.global.te(`roles.${id}.desc`)).toBe(true)
    }
    expect(i18n.global.t('common.seat', { n: 3 })).toBe('3 號')
  })
})
