/**
 * Workspace boundaries:
 * - an app never imports another app (by package name or a relative path out of it)
 * - a package never imports an app
 * - rules stays pure TypeScript: no Vue, Pinia, i18n, storage, icons or DOM
 * - icons are Tabler only (`i-tabler-*`)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const dirs = (d: string) =>
  readdirSync(join(root, d)).filter((n) => statSync(join(root, d, n)).isDirectory())
const apps = dirs('apps')
const appPackages = new Set(apps.map((a) => `@werewolf/${a}`))
const PURE = new Set(['werewolf-rules'])
const UI_ONLY = [
  /^vue(-router|-i18n)?(\/|$)/,
  /^pinia/,
  /^@werewolf\/(?!rules)/,
  /^dexie/,
  /^@iconify/,
  /^zod/,
]

function files(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (['node_modules', 'dist', 'cache'].includes(n)) return []
    return statSync(p).isDirectory() ? files(p) : /\.(ts|vue|md)$/.test(n) ? [p] : []
  })
}

const IMPORT =
  /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|^import\s+['"]([^'"]+)['"]/gm
const OTHER_ICONS = /\bi-(?!tabler-)[a-z0-9]+-[a-z0-9-]+\b/g
const problems: string[] = []

for (const [kind, name] of [
  ...apps.map((a) => ['apps', a] as const),
  ...dirs('packages').map((p) => ['packages', p] as const),
]) {
  const base = join(root, kind, name)
  const sources = [...files(join(base, 'src')), ...files(join(base, '.vitepress'))]
  for (const file of sources) {
    const text = readFileSync(file, 'utf8')
    const where = relative(root, file)
    for (const m of text.matchAll(IMPORT)) {
      const spec = m[1] ?? m[2] ?? m[3]!
      if (appPackages.has(spec)) problems.push(`${where}: imports app ${spec}`)
      if (spec.startsWith('.')) {
        const target = resolve(file, '..', spec)
        if (!target.startsWith(base + sep) && target.startsWith(join(root, 'apps') + sep))
          problems.push(`${where}: reaches into another app (${spec})`)
      }
      if (kind === 'packages' && PURE.has(name) && UI_ONLY.some((re) => re.test(spec)))
        problems.push(`${where}: pure package imports ${spec}`)
    }
    if (kind === 'packages' && PURE.has(name) && /\b(window|document|localStorage)\./.test(text))
      problems.push(`${where}: pure package uses the DOM`)
    for (const m of text.matchAll(OTHER_ICONS))
      problems.push(`${where}: ${m[0]} is not a Tabler icon`)
  }
}

if (problems.length) {
  console.error(`Workspace boundary violations:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
