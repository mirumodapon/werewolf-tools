/**
 * Third-party notices for what a build ships: find the npm package behind each bundled
 * module, check its license against an allowlist, and render one plain-text file with
 * every license text and NOTICE file.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Permissive licenses only: they ask that the license text (and Apache's NOTICE) travel
 * with the code. A dual-licensed package passes through its allowed option.
 */
export const ALLOWED_LICENSES = [
  'MIT',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  '0BSD',
  'Apache-2.0',
  'BlueOak-1.0.0',
  'CC0-1.0',
  'Unlicense',
  'Zlib',
] as const

const NODE_MODULES = '/node_modules/'

/** The package a module id belongs to; null for our own code and virtual modules. */
export function packageOf(moduleId: string): { name: string; dir: string } | null {
  const id = moduleId
    .replace(/^\0/, '')
    .replace(/[?#].*$/, '')
    .replaceAll('\\', '/')
  const at = id.lastIndexOf(NODE_MODULES)
  if (at === -1) return null
  const parts = id.slice(at + NODE_MODULES.length).split('/')
  const name = parts[0]?.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0]
  if (!name || name.startsWith('.')) return null
  return { name, dir: id.slice(0, at + NODE_MODULES.length + name.length) }
}

const isAllowed = (id: string) => (ALLOWED_LICENSES as readonly string[]).includes(id)

/** The option we use from an SPDX expression, or null when none is allowed. */
export function chooseLicense(expression: string): string | null {
  const flat = expression.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()
  for (const option of flat.split(/ OR /i)) {
    if (option.split(/ AND /i).every((part) => isAllowed(part.trim()))) return option.trim()
  }
  return null
}

/** For packages that declare nothing: only texts that name themselves unambiguously. */
export function detectLicense(text: string): string | null {
  if (/\bMIT License\b/i.test(text) && /Permission is hereby granted/.test(text)) return 'MIT'
  if (/Apache License,?\s+Version 2\.0/i.test(text)) return 'Apache-2.0'
  if (/^ISC License/im.test(text)) return 'ISC'
  return null
}

export interface PackageNotice {
  name: string
  version: string
  declared: string
  /** The license we use it under; null when not allowed. */
  license: string | null
  homepage: string | null
  files: { name: string; text: string }[]
}

interface PackageJson {
  name?: string
  version?: string
  license?: string | { type?: string }
  licenses?: { type?: string }[]
  homepage?: string
  repository?: string | { url?: string }
}

function declaredLicense(pkg: PackageJson): string {
  if (typeof pkg.license === 'string') return pkg.license
  if (pkg.license?.type) return pkg.license.type
  const types = (pkg.licenses ?? []).map((l) => l.type).filter(Boolean)
  return types.length ? types.join(' OR ') : 'UNKNOWN'
}

const LICENSE_FILE = /^(licen[cs]e|copying|notice)/i
const noticeLast = (name: string) => (/^notice/i.test(name) ? 1 : 0)

export function readPackage(dir: string): PackageNotice {
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as PackageJson
  const files = readdirSync(dir)
    .filter((n) => LICENSE_FILE.test(n))
    .toSorted((a, b) => noticeLast(a) - noticeLast(b) || a.localeCompare(b))
    .map((n) => ({ name: n, text: readFileSync(join(dir, n), 'utf8').trim() }))
  let declared = declaredLicense(pkg)
  if (declared === 'UNKNOWN')
    declared = files.map((f) => detectLicense(f.text)).find(Boolean) ?? declared
  const repository = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url
  return {
    name: pkg.name ?? dir,
    version: pkg.version ?? '',
    declared,
    license: chooseLicense(declared),
    homepage: pkg.homepage ?? repository ?? null,
    files,
  }
}

const RULE = '='.repeat(72)

export function renderNotices(title: string, packages: readonly PackageNotice[]): string {
  const sorted = packages.toSorted((a, b) => a.name.localeCompare(b.name))
  const lines = [
    `${title}：第三方授權聲明`,
    '',
    '本專案以 MIT 授權釋出。以下是建置後實際包含在網站中的第三方套件與它們的授權條款。',
    '',
    ...sorted.map((p) => {
      const usedAs = p.license && p.license !== p.declared ? `（以 ${p.license} 使用）` : ''
      return `- ${p.name}@${p.version}：${p.declared}${usedAs}`
    }),
  ]
  for (const p of sorted) {
    lines.push('', RULE, `${p.name}@${p.version}`, `License: ${p.declared}`)
    if (p.license && p.license !== p.declared) lines.push(`Used under: ${p.license}`)
    if (p.homepage) lines.push(`Source: ${p.homepage}`)
    lines.push(RULE)
    if (!p.files.length) lines.push('', `（套件未附授權檔，授權為 ${p.declared}）`)
    for (const f of p.files) lines.push('', `--- ${f.name} ---`, '', f.text)
  }
  return `${lines.join('\n')}\n`
}
