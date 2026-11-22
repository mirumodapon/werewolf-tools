/** Every external dependency must come from the pnpm catalog ("catalog:"). */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const manifests = [
  'package.json',
  ...['apps', 'packages'].flatMap((d) =>
    readdirSync(join(root, d)).map((n) => join(d, n, 'package.json')),
  ),
].filter((f) => existsSync(join(root, f)))
const sections = ['dependencies', 'devDependencies', 'optionalDependencies'] as const

const problems: string[] = []
for (const file of manifests) {
  const pkg = JSON.parse(readFileSync(join(root, file), 'utf8')) as Partial<
    Record<(typeof sections)[number], Record<string, string>>
  >
  for (const section of sections)
    for (const [name, spec] of Object.entries(pkg[section] ?? {}))
      if (!spec.startsWith('catalog:') && !spec.startsWith('workspace:'))
        problems.push(`${file} ${section}.${name} = "${spec}"`)
}

if (problems.length) {
  console.error(
    `Use "catalog:" (pnpm-workspace.yaml) for external dependencies:\n  ${problems.join('\n  ')}`,
  )
  process.exit(1)
}
