/**
 * Scaffolds a tool:
 *
 *   pnpm new:app <id> --name 名稱 --name-en Name [--description 說明] [--description-en text]
 *                [--icon tabler-name] [--accent red|orange|yellow|green|teal|cyan|blue|purple]
 *
 * Copies scripts/templates/app to apps/<id>, registers it (alpha), adds `pnpm dev:<id>`,
 * installs, makes its icons and formats the new files.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ID_PATTERN, tools } from '../packages/registry/src/index.ts'
import { root } from './lib/apps.ts'

const MARKER = '  // new:app inserts here'
const ACCENTS = ['red', 'orange', 'yellow', 'green', 'teal', 'cyan', 'blue', 'purple']
const q = (s: string) => `'${s.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
const option = (flag: string) => {
  const i = process.argv.indexOf(flag)
  return i > -1 ? process.argv[i + 1] : undefined
}
function fail(message: string): never {
  console.error(`new:app: ${message}`)
  process.exit(1)
}

const id = process.argv[2]
if (!id || id.startsWith('--')) fail('usage: pnpm new:app <id> --name 名稱 --name-en Name [...]')
if (!ID_PATTERN.test(id)) fail(`id must match ${ID_PATTERN}`)
if (tools.some((t) => t.id === id)) fail(`${id} is already registered`)
const target = join(root, 'apps', id)
if (existsSync(target)) fail(`apps/${id} already exists`)

const meta = {
  name: option('--name') ?? id,
  nameEn: option('--name-en') ?? option('--name') ?? id,
  description: option('--description') ?? '',
  descriptionEn: option('--description-en') ?? option('--description') ?? '',
  icon: option('--icon') ?? 'tool',
  accent: option('--accent') ?? 'blue',
}
if (!ACCENTS.includes(meta.accent)) fail(`accent must be one of ${ACCENTS.join(', ')}`)
const tabler = JSON.parse(
  readFileSync(
    join(root, 'packages/registry/node_modules/@iconify-json/tabler/icons.json'),
    'utf8',
  ),
) as {
  icons: Record<string, unknown>
}
if (!tabler.icons[meta.icon]) fail(`unknown Tabler icon ${meta.icon}`)

const fill = (s: string) =>
  s
    .replaceAll('__ID__', id)
    .replaceAll('__NAME_EN__', meta.nameEn)
    .replaceAll('__NAME__', meta.name)
    .replaceAll('__DESCRIPTION__', meta.description)
function copy(from: string, to: string) {
  mkdirSync(to, { recursive: true })
  for (const entry of readdirSync(from)) {
    const src = join(from, entry)
    if (statSync(src).isDirectory()) copy(src, join(to, entry))
    else writeFileSync(join(to, entry.replace(/\.tmpl$/, '')), fill(readFileSync(src, 'utf8')))
  }
}
copy(join(root, 'scripts/templates/app'), target)

const toolsFile = join(root, 'packages/registry/src/tools.ts')
const registry = readFileSync(toolsFile, 'utf8')
if (!registry.includes(MARKER)) fail('marker not found in packages/registry/src/tools.ts')
const loc = (zh: string, en: string) => `{ 'zh-TW': ${q(zh)}, 'en-US': ${q(en)} }`
writeFileSync(
  toolsFile,
  registry.replace(
    MARKER,
    `  {
    id: ${q(id)},
    kind: 'pwa',
    name: ${loc(meta.name, meta.nameEn)},
    shortName: ${loc(meta.name, meta.nameEn)},
    description: ${loc(meta.description, meta.descriptionEn)},
    path: '/${id}/',
    icon: ${q(meta.icon)},
    accent: ${q(meta.accent)},
    status: 'alpha',
  },
${MARKER}`,
  ),
)

const rootPkgFile = join(root, 'package.json')
const rootPkg = JSON.parse(readFileSync(rootPkgFile, 'utf8')) as { scripts: Record<string, string> }
rootPkg.scripts[`dev:${id}`] = `pnpm --filter @werewolf/${id} dev`
writeFileSync(rootPkgFile, `${JSON.stringify(rootPkg, null, 2)}\n`)

const run = (cmd: string, args: string[]) =>
  execFileSync(cmd, args, { cwd: root, stdio: 'inherit' })
run('pnpm', ['install'])
run('node', ['packages/pwa/scripts/icons.ts', id])
run('pnpm', ['exec', 'vp', 'fmt', `apps/${id}`, 'packages/registry/src/tools.ts', 'package.json'])

console.warn(`
apps/${id} created (/${id}/, alpha)
  pnpm dev:${id}   this app alone
  pnpm dev         every app at http://localhost:5173/
  Name, icon and color: packages/registry/src/tools.ts (then pnpm icons ${id})`)
