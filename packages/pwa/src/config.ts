import {
  DEFAULT_LOCALE,
  manifestName,
  nestedToolPaths,
  tools as allTools,
  type ToolMeta,
} from '@werewolf/registry'
import { themeColorOf } from '@werewolf/theme'
import { VitePWA, type VitePWAOptions } from 'vite-plugin-pwa'
import type { PluginOption } from 'vite-plus'
import { CLEANUP_SCRIPT, swCleanupPlugin } from './cleanup.ts'

/** Splash and title bar: the Night background. */
export const PWA_THEME_COLOR = themeColorOf('night')

/** Made by `pnpm icons` in each app's `public/`. */
export const PWA_ICONS = [
  { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
  { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
  { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
  { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
] as const

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** A tool path with or without the trailing slash: `/deal` and `/deal/…`. */
export function pathPattern(path: string): RegExp {
  return new RegExp(`^${escapeRegExp(path.replace(/\/$/, ''))}(/|$)`)
}

/** A path ending in a file name (`/deal/licenses.txt`) must reach the network, not the app shell. */
export const FILE_PATH = /\/[^/?]+\.[^/]+$/

export const cacheIdOf = (tool: ToolMeta) => `werewolf-${tool.id}`

export const MANIFEST_LANG = DEFAULT_LOCALE === 'zh-TW' ? 'zh-Hant-TW' : 'en-US'

/**
 * vite-plugin-pwa options for one tool: its own manifest id, scope and start URL, and a
 * worker that leaves other tools inside its scope alone (home's `/` covers `/deal/`).
 */
export function createPwaConfig(
  tool: ToolMeta,
  tools: readonly ToolMeta[] = allTools,
): Partial<VitePWAOptions> {
  return {
    registerType: 'prompt',
    includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
    manifest: {
      id: tool.path,
      name: manifestName(tool),
      short_name: tool.shortName[DEFAULT_LOCALE],
      description: tool.description[DEFAULT_LOCALE],
      lang: MANIFEST_LANG,
      start_url: tool.path,
      scope: tool.path,
      display: 'standalone',
      orientation: 'portrait',
      theme_color: PWA_THEME_COLOR,
      background_color: PWA_THEME_COLOR,
      icons: PWA_ICONS.map((icon) => ({ ...icon })),
    },
    workbox: {
      cacheId: cacheIdOf(tool),
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      navigateFallback: 'index.html',
      navigateFallbackDenylist: [...nestedToolPaths(tool, tools).map(pathPattern), FILE_PATH],
      // Replaced by CLEANUP_SCRIPT (Workbox's would delete nested apps' caches).
      cleanupOutdatedCaches: false,
      globIgnores: [CLEANUP_SCRIPT],
      importScripts: [CLEANUP_SCRIPT],
    },
  }
}

export function werewolfPwa(tool: ToolMeta): PluginOption[] {
  return [swCleanupPlugin(cacheIdOf(tool)), VitePWA(createPwaConfig(tool))]
}
