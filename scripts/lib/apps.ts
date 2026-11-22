/** Apps to build and serve: registry tools (not coming-soon) that have a folder in apps/. */
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { builtTools, type ToolMeta } from '../../packages/registry/src/index.ts'

export const root = resolve(new URL('../..', import.meta.url).pathname)
export const distDir = join(root, 'dist')

export const appDir = (tool: ToolMeta) => join(root, 'apps', tool.id)
export const packageName = (tool: ToolMeta) => `@werewolf/${tool.id}`

/** Where an app's build lands (VitePress is configured to use dist/ too). */
export const appDist = (tool: ToolMeta) => join(appDir(tool), 'dist')

/** Shorter paths first, so a parent never overwrites a nested tool when copying. */
export function apps(only: readonly string[] = []): ToolMeta[] {
  return builtTools()
    .filter((t) => existsSync(join(appDir(t), 'package.json')))
    .filter((t) => !only.length || only.includes(t.id))
    .toSorted((a, b) => a.path.length - b.path.length)
}
