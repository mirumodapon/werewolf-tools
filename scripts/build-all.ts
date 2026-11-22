/**
 * Builds every app (`vp run`, cached and ordered) and assembles one site in dist/: home at
 * the root, each other app at its registry path, and 404.html (home) for GitHub Pages.
 *
 *   node scripts/build-all.ts [--skip-build]
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { LICENSES_FILE } from '../packages/licenses/src/vite.ts'
import { appDist, apps, distDir, packageName, root } from './lib/apps.ts'

const list = apps()
if (!list.some((t) => t.path === '/')) throw new Error('home (path /) has no app to build')

if (!process.argv.includes('--skip-build'))
  for (const t of list)
    execFileSync('pnpm', ['exec', 'vp', 'run', `${packageName(t)}#build`], {
      cwd: root,
      stdio: 'inherit',
    })

rmSync(distDir, { recursive: true, force: true })
const problems: string[] = []
for (const tool of list) {
  const from = appDist(tool)
  const expected =
    tool.kind === 'pwa'
      ? ['index.html', LICENSES_FILE, 'manifest.webmanifest', 'sw.js']
      : ['index.html']
  for (const f of expected)
    if (!existsSync(join(from, f))) problems.push(`${tool.id}: dist/${f} is missing`)
  if (tool.kind === 'docs' && existsSync(join(from, 'sw.js')))
    problems.push(`${tool.id}: the docs must not have a service worker`)
  cpSync(from, join(distDir, tool.path), { recursive: true })
  console.warn(`dist${tool.path} ← apps/${tool.id}/dist`)
}
copyFileSync(join(distDir, 'index.html'), join(distDir, '404.html'))

// A worker must never precache another app's files nor answer its navigations.
for (const tool of list.filter((t) => t.kind === 'pwa')) {
  const sw = readFileSync(join(distDir, tool.path, 'sw.js'), 'utf8')
  for (const other of list.filter((o) => o.path !== tool.path && o.path.startsWith(tool.path))) {
    const nested = other.path.slice(tool.path.length)
    if (sw.includes(`url:"${nested}`)) problems.push(`${tool.id}: sw.js precaches ${other.path}`)
    // Ids are lowercase letters, digits and dashes: no escaping needed.
    if (!sw.includes(`/^\\/${other.id}(\\/|$)/`))
      problems.push(`${tool.id}: sw.js does not leave ${other.path} alone`)
  }
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.warn(`dist/404.html ← home; ${list.length} apps`)
