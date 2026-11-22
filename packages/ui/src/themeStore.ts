import { onStoreChange, readStore, writeStore } from '@werewolf/storage'
import {
  applyTheme,
  PREFERS_DARK_QUERY,
  THEME_KEY,
  THEME_STORE,
  type ThemeMode,
  type ThemeName,
} from '@werewolf/theme'
import { defineStore } from 'pinia'
import { ref } from 'vue'

/** The theme every tool shares; follows the OS on `system` and other apps' changes. */
export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(readStore(THEME_STORE).mode)
  const theme = ref<ThemeName>(applyTheme(mode.value))
  const apply = () => (theme.value = applyTheme(mode.value))

  function setMode(next: ThemeMode) {
    mode.value = next
    writeStore(THEME_STORE, { mode: next })
    apply()
  }

  onStoreChange(THEME_KEY, () => {
    mode.value = readStore(THEME_STORE).mode
    apply()
  })
  if (typeof window !== 'undefined')
    window.matchMedia?.(PREFERS_DARK_QUERY).addEventListener?.('change', apply)

  return { mode, theme, setMode }
})
