import type { Plugin } from 'vite-plus'
import { themeBootstrapScript } from './bootstrap.ts'

/** Puts the anti-flash theme script first in `<head>`. */
export function tokyoNightThemePlugin(): Plugin {
  return {
    name: 'werewolf:tokyo-night-theme',
    transformIndexHtml: () => [
      { tag: 'script', children: themeBootstrapScript(), injectTo: 'head-prepend' },
    ],
  }
}
