import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vite-plus/test'
import { chooseLicense, detectLicense, packageOf, readPackage, renderNotices } from './licenses.ts'

function fakePackage(name: string, pkg: object, files: Record<string, string>): string {
  const dir = join(mkdtempSync(join(tmpdir(), 'lic-')), 'node_modules', name)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, ...pkg }))
  for (const [file, text] of Object.entries(files)) writeFileSync(join(dir, file), text)
  return dir
}

describe('packageOf', () => {
  it('finds plain and scoped packages', () => {
    expect(packageOf('/w/node_modules/.pnpm/dexie@4/node_modules/dexie/dist/dexie.mjs')).toEqual({
      name: 'dexie',
      dir: '/w/node_modules/.pnpm/dexie@4/node_modules/dexie',
    })
    expect(packageOf('/w/node_modules/@vue/shared/dist/x.js?v=1')?.name).toBe('@vue/shared')
  })

  it('ignores our sources and virtual modules', () => {
    expect(packageOf('/w/packages/ui/src/AppShell.vue')).toBeNull()
    expect(packageOf('\0vite/preload-helper.js')).toBeNull()
  })
})

describe('chooseLicense', () => {
  it('accepts permissive licenses and permissive options', () => {
    expect(chooseLicense('MIT')).toBe('MIT')
    expect(chooseLicense('(MPL-2.0 OR Apache-2.0)')).toBe('Apache-2.0')
  })

  it('refuses copyleft', () => {
    expect(chooseLicense('GPL-3.0')).toBeNull()
    expect(chooseLicense('MIT AND GPL-3.0')).toBeNull()
    expect(chooseLicense('UNKNOWN')).toBeNull()
  })
})

describe('notices', () => {
  it('detects a license from its text', () => {
    expect(detectLicense('The MIT License\n\nPermission is hereby granted, free')).toBe('MIT')
    expect(detectLicense('GNU GENERAL PUBLIC LICENSE')).toBeNull()
  })

  it('collects license and NOTICE files', () => {
    const dir = fakePackage(
      'demo',
      { version: '1.0.0', license: '(MPL-2.0 OR Apache-2.0)' },
      { NOTICE: 'Demo NOTICE', LICENSE: 'Demo license' },
    )
    const notice = readPackage(dir)
    expect(notice.files.map((f) => f.name)).toEqual(['LICENSE', 'NOTICE'])
    const text = renderNotices('測試', [notice])
    expect(text).toContain('- demo@1.0.0：(MPL-2.0 OR Apache-2.0)（以 Apache-2.0 使用）')
    expect(text).toContain('Demo NOTICE')
  })

  it('reads the license file when package.json names none', () => {
    const dir = fakePackage(
      'bare',
      { version: '2.0.0' },
      {
        license: 'The MIT License\n\nPermission is hereby granted…',
      },
    )
    expect(readPackage(dir)).toMatchObject({ declared: 'MIT', license: 'MIT' })
  })
})
