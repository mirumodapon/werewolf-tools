/**
 * Both languages have exactly the same keys, none empty, in the shared strings and every
 * app's locales/; every role has a name and a description.
 */
import { existsSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { flattenKeys, keyDifferences } from '../packages/i18n/src/keys.ts'
import { ROLE_IDS } from '../packages/werewolf-rules/src/roles.ts'

const root = new URL('..', import.meta.url).pathname
const LOCALES = ['zh-TW', 'en-US'] as const
const dirs = [
  join(root, 'packages/i18n/src/messages'),
  ...readdirSync(join(root, 'apps')).map((a) => join(root, 'apps', a, 'src/locales')),
].filter((d) => existsSync(d))

const load = async (file: string) =>
  ((await import(pathToFileURL(file).href)) as { default: unknown }).default
const valueAt = (messages: unknown, key: string) =>
  key
    .split('.')
    .reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], messages)

const problems: string[] = []
for (const dir of dirs) {
  const where = relative(root, dir)
  const [zh, en] = await Promise.all(
    LOCALES.map(async (l) => {
      const file = join(dir, `${l}.ts`)
      if (existsSync(file)) return load(file)
      problems.push(`${where}/${l}.ts is missing`)
      return {}
    }),
  )
  const { onlyA, onlyB } = keyDifferences(zh, en)
  for (const k of onlyA) problems.push(`${where}: ${k} is only in zh-TW`)
  for (const k of onlyB) problems.push(`${where}: ${k} is only in en-US`)
  for (const [locale, messages] of [
    ['zh-TW', zh],
    ['en-US', en],
  ] as const)
    for (const k of flattenKeys(messages)) {
      const value = valueAt(messages, k)
      // `status.stable` is deliberately empty: stable tools show no badge.
      if (typeof value !== 'string' || (!value.trim() && k !== 'status.stable'))
        problems.push(`${where} ${locale}: ${k} is empty`)
    }
}

for (const l of LOCALES) {
  const keys = new Set(flattenKeys(await load(join(root, 'packages/i18n/src/messages', `${l}.ts`))))
  for (const id of ROLE_IDS)
    for (const field of ['name', 'desc'])
      if (!keys.has(`roles.${id}.${field}`)) problems.push(`${l}: roles.${id}.${field} is missing`)
}

if (problems.length) {
  console.error(`i18n problems:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
