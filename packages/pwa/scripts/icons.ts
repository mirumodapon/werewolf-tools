/**
 * Makes each installable app's icons from the registry: its Tabler icon in its accent,
 * written to `apps/<id>/public/icon.svg`, then expanded into favicon, apple-touch, PWA and
 * maskable PNGs by @vite-pwa/assets-generator.
 *
 *   node packages/pwa/scripts/icons.ts [id...]
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pwaTools } from '../../registry/src/index.ts'
import { iconSvg } from '../src/icon.ts'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const config = fileURLToPath(new URL('../pwa-assets.config.ts', import.meta.url))
const require = createRequire(import.meta.url)
const cli = join(
  dirname(require.resolve('@vite-pwa/assets-generator/package.json')),
  'bin/pwa-assets-generator.mjs',
)
const tabler = JSON.parse(
  readFileSync(require.resolve('@iconify-json/tabler/icons.json'), 'utf8'),
) as {
  icons: Record<string, { body: string }>
}

const only = process.argv.slice(2)
for (const tool of pwaTools()) {
  const appDir = join(root, 'apps', tool.id)
  if (!existsSync(join(appDir, 'package.json')) || (only.length && !only.includes(tool.id)))
    continue
  const icon = tabler.icons[tool.icon]
  if (!icon) throw new Error(`${tool.id}: unknown Tabler icon ${tool.icon}`)
  mkdirSync(join(appDir, 'public'), { recursive: true })
  writeFileSync(join(appDir, 'public/icon.svg'), iconSvg(icon.body, tool.accent))
  execFileSync(process.execPath, [cli, '--root', appDir, '--config', config], { stdio: 'inherit' })
  console.warn(`icons: ${tool.id} (${tool.icon}, ${tool.accent})`)
}
