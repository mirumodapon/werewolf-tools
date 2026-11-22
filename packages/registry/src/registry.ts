import { TOOLS } from './tools.ts'
import type { Locale, ToolMeta } from './types.ts'

export const ID_PATTERN = /^[a-z][a-z0-9-]*$/
const ICON_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Manifests and the HTML shells use the default language. */
export const DEFAULT_LOCALE: Locale = 'zh-TW'

export const tools: readonly ToolMeta[] = TOOLS

export function toolById(id: string, list: readonly ToolMeta[] = tools): ToolMeta {
  const tool = list.find((t) => t.id === id)
  if (!tool) throw new Error(`unknown tool: ${id}`)
  return tool
}

/** Tools with an app to build (everything but coming-soon), docs included. */
export function builtTools(list: readonly ToolMeta[] = tools): ToolMeta[] {
  return list.filter((t) => t.status !== 'coming-soon')
}

/** Installable apps (each has a manifest and a service worker). */
export function pwaTools(list: readonly ToolMeta[] = tools): ToolMeta[] {
  return builtTools(list).filter((t) => t.kind === 'pwa')
}

/** Home-page cards: everything but home, coming-soon last. */
export function listedTools(list: readonly ToolMeta[] = tools): ToolMeta[] {
  const rest = list.filter((t) => t.id !== 'home')
  return [
    ...rest.filter((t) => t.status !== 'coming-soon'),
    ...rest.filter((t) => t.status === 'coming-soon'),
  ]
}

/** Home keeps its name; tools are prefixed with the suite's short name. */
export function manifestName(tool: ToolMeta, locale: Locale = DEFAULT_LOCALE): string {
  if (tool.path === '/') return tool.name[locale]
  const separator = locale === 'zh-TW' ? '・' : ' · '
  return `${toolById('home').shortName[locale]}${separator}${tool.name[locale]}`
}

/**
 * Paths of other tools inside `tool`'s scope. Its service worker must leave their
 * navigations alone (home's scope `/` covers `/deal/`).
 */
export function nestedToolPaths(tool: ToolMeta, list: readonly ToolMeta[] = tools): string[] {
  return list
    .filter((o) => o.id !== tool.id && o.path !== tool.path && o.path.startsWith(tool.path))
    .map((o) => o.path)
}

/** The tool that serves a URL path: the longest matching prefix. */
export function toolForPath(list: readonly ToolMeta[], pathname: string): ToolMeta | undefined {
  const dir = pathname.endsWith('/') ? pathname : `${pathname}/`
  return list
    .filter((t) => dir.startsWith(t.path))
    .toSorted((a, b) => b.path.length - a.path.length)[0]
}

/** Problems with the list, as readable sentences (empty when valid). */
export function validateTools(list: readonly ToolMeta[]): string[] {
  const problems: string[] = []
  for (const key of ['id', 'path'] as const) {
    const counts = new Map<string, number>()
    for (const t of list) counts.set(t[key], (counts.get(t[key]) ?? 0) + 1)
    for (const [value, n] of counts) if (n > 1) problems.push(`duplicate ${key}: ${value}`)
  }
  for (const t of list) {
    if (!ID_PATTERN.test(t.id))
      problems.push(`${t.id}: id must be lowercase letters, digits, dashes`)
    const expected = t.id === 'home' ? '/' : `/${t.id}/`
    if (t.path !== expected) problems.push(`${t.id}: path must be ${expected} (got ${t.path})`)
    if (!ICON_PATTERN.test(t.icon)) problems.push(`${t.id}: icon must be a Tabler icon name`)
    for (const field of ['name', 'shortName'] as const)
      for (const locale of ['zh-TW', 'en-US'] as const)
        if (!t[field][locale]?.trim()) problems.push(`${t.id}: ${field}.${locale} is required`)
  }
  const home = list.find((t) => t.id === 'home')
  if (!home) problems.push('home is required')
  else if (home.kind !== 'pwa') problems.push('home must be a pwa')
  return problems
}

/** Built at runtime, so home's UnoCSS config safelists every tool's class. */
export function toolIconClass(tool: ToolMeta): string {
  return `i-tabler-${tool.icon}`
}
