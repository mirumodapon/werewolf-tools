import { LOCALES, type Locale } from '@werewolf/rules'
import { globalKey, onStoreChange, readStore, writeStore, type StoreSpec } from '@werewolf/storage'

export { LOCALES, type Locale }

/** Every tool starts in 繁體中文; English only when chosen in the settings. */
export const DEFAULT_LOCALE: Locale = 'zh-TW'

/** Shared by every tool; other open apps follow through the `storage` event. */
export const LOCALE_KEY = globalKey('locale')

export const LOCALE_STORE: StoreSpec<Locale | null> = {
  key: LOCALE_KEY,
  version: 1,
  parse: (data) => ((LOCALES as readonly unknown[]).includes(data) ? (data as Locale) : null),
  fallback: () => null,
}

export function readLocale(): Locale {
  return readStore(LOCALE_STORE) ?? DEFAULT_LOCALE
}

export function writeLocale(locale: Locale): void {
  writeStore(LOCALE_STORE, locale)
}

export function onLocaleChange(onChange: (locale: Locale) => void): () => void {
  return onStoreChange(LOCALE_KEY, () => onChange(readLocale()))
}

export const htmlLang = (locale: Locale) => (locale === 'zh-TW' ? 'zh-Hant-TW' : 'en-US')
