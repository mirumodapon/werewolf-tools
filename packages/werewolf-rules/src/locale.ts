export const LOCALES = ['zh-TW', 'en-US'] as const
export type Locale = (typeof LOCALES)[number]

/** A text in every supported language. */
export type Localized = Record<Locale, string>

/** Plain strings (names people typed) read the same in every language. */
export function localized(text: Localized | string, locale: Locale): string {
  return typeof text === 'string' ? text : text[locale]
}
