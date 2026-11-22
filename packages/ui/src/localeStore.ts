import {
  htmlLang,
  onLocaleChange,
  readLocale,
  writeLocale,
  type Locale,
  type WerewolfI18n,
} from '@werewolf/i18n'
import { defineStore } from 'pinia'
import { inject, ref, type InjectionKey } from 'vue'

/** Provided by `installWerewolf` (vue-i18n keeps its own injection key private). */
export const I18N_KEY: InjectionKey<WerewolfI18n> = Symbol('werewolf-i18n')

/** The language every tool shares: vue-i18n, `<html lang>`, and other apps' changes. */
export const useLocaleStore = defineStore('locale', () => {
  const i18n = inject(I18N_KEY, null)
  const locale = ref<Locale>(readLocale())

  function apply(next: Locale) {
    locale.value = next
    if (i18n) i18n.global.locale.value = next
    if (typeof document !== 'undefined') document.documentElement.lang = htmlLang(next)
  }

  function setLocale(next: Locale) {
    writeLocale(next)
    apply(next)
  }

  apply(locale.value)
  onLocaleChange(apply)
  return { locale, setLocale }
})
