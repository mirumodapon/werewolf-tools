/**
 * One version for the repo (root package.json), 0.0.x until the first release. Workspace
 * packages and the new:app template must not declare their own.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const manifests = [
  ...['apps', 'packages'].flatMap((d) =>
    readdirSync(join(root, d)).map((n) => join(root, d, n, 'package.json')),
  ),
  join(root, 'scripts/templates/app/package.json.tmpl'),
].filter((p) => existsSync(p))

const problems: string[] = []
const { version = '' } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  version?: string
}
if (!/^0\.0\.(0|[1-9]\d*)$/.test(version))
  problems.push(`package.json: version must be 0.0.x (got "${version}")`)
for (const p of manifests)
  if ('version' in JSON.parse(readFileSync(p, 'utf8')))
    problems.push(`${relative(root, p)}: remove "version"`)

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
