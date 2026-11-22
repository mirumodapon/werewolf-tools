import { createI18n, type I18n } from 'vue-i18n'
import { DEFAULT_LOCALE, readLocale, type Locale } from './locale.ts'
import enUS from './messages/en-US.ts'
import zhTW from './messages/zh-TW.ts'

export const SHARED_MESSAGES = { 'zh-TW': zhTW, 'en-US': enUS } as const

type Messages = Record<string, unknown>

export type WerewolfI18n = I18n<Messages, Messages, Messages, string, false>

function merge(a: Messages, b: Messages): Messages {
  const out: Messages = { ...a }
  for (const [key, value] of Object.entries(b)) {
    const prev = out[key]
    out[key] =
      typeof value === 'object' && value && typeof prev === 'object' && prev
        ? merge(prev as Messages, value as Messages)
        : value
  }
  return out
}

/** vue-i18n with the shared strings plus an app's own (`apps/<id>/src/locales`). */
export function createWerewolfI18n(
  appMessages: Record<Locale, Messages> = { 'zh-TW': {}, 'en-US': {} },
  locale: Locale = readLocale(),
): WerewolfI18n {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: DEFAULT_LOCALE,
    // Keys are not typed per app; scripts/check-i18n.ts keeps both languages in step.
    messages: {
      'zh-TW': merge(SHARED_MESSAGES['zh-TW'], appMessages['zh-TW']),
      'en-US': merge(SHARED_MESSAGES['en-US'], appMessages['en-US']),
    } as never,
  }) as unknown as WerewolfI18n
}
