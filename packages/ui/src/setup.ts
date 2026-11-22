import { createWerewolfI18n, type Locale } from '@werewolf/i18n'
import { toolById, type ToolMeta } from '@werewolf/registry'
import { createPinia } from 'pinia'
import type { App, InjectionKey } from 'vue'
import { I18N_KEY, useLocaleStore } from './localeStore.ts'
import { noZoom } from './noZoom.ts'
import { useThemeStore } from './themeStore.ts'

/** The running tool, for the status badge and the home link in `<AppShell>`. */
export const TOOL_KEY: InjectionKey<ToolMeta> = Symbol('werewolf-tool')

/**
 * Pinia, vue-i18n (shared + the app's strings), the tool, the theme and language stores,
 * and no zooming on phones.
 */
export function installWerewolf(
  app: App,
  toolId: string,
  messages?: Record<Locale, Record<string, unknown>>,
): void {
  const pinia = createPinia()
  app.use(pinia)
  const i18n = createWerewolfI18n(messages)
  app.use(i18n)
  app.provide(I18N_KEY, i18n)
  app.provide(TOOL_KEY, toolById(toolId))
  app.runWithContext(() => {
    useThemeStore(pinia)
    useLocaleStore(pinia)
  })
  if (typeof document !== 'undefined') noZoom()
}
