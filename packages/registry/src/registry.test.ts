import icons from '@iconify-json/tabler/icons.json' with { type: 'json' }
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vite-plus/test'
import {
  builtTools,
  listedTools,
  manifestName,
  nestedToolPaths,
  pwaTools,
  toolById,
  toolForPath,
  tools,
  validateTools,
} from './registry.ts'
import type { ToolMeta } from './types.ts'

const root = fileURLToPath(new URL('../../..', import.meta.url))

const tool = (id: string, status: ToolMeta['status'] = 'alpha'): ToolMeta => ({
  id,
  kind: 'pwa',
  name: { 'zh-TW': id, 'en-US': id },
  shortName: { 'zh-TW': id, 'en-US': id },
  description: { 'zh-TW': '', 'en-US': '' },
  path: id === 'home' ? '/' : `/${id}/`,
  icon: 'x',
  accent: 'blue',
  status,
})

describe('registry', () => {
  it('is valid', () => {
    expect(validateTools(tools)).toEqual([])
  })

  it('marks every tool alpha', () => {
    expect(tools.filter((t) => t.status !== 'alpha').map((t) => t.id)).toEqual([])
  })

  it('has an app folder for every built tool', () => {
    const missing = builtTools().filter(
      (t) => !existsSync(join(root, 'apps', t.id, 'package.json')),
    )
    expect(missing.map((t) => t.id)).toEqual([])
  })

  it('only uses Tabler icons that exist', () => {
    const names = new Set(Object.keys((icons as { icons: object }).icons))
    expect(tools.filter((t) => !names.has(t.icon)).map((t) => t.icon)).toEqual([])
  })

  it('lists tools without home, coming-soon last', () => {
    const list = [tool('home'), tool('a', 'coming-soon'), tool('b')]
    expect(listedTools(list).map((t) => t.id)).toEqual(['b', 'a'])
  })

  it('separates installable apps from the docs', () => {
    expect(pwaTools().map((t) => t.id)).toEqual(['home', 'deal', 'judge'])
  })

  it('names manifests in both languages', () => {
    expect(manifestName(toolById('judge'))).toBe('狼人殺・法官輔助')
    expect(manifestName(toolById('deal'), 'en-US')).toBe('Werewolf · Role Deal')
    expect(manifestName(toolById('home'))).toBe('狼人殺工具集')
  })

  it('finds nested tools and the tool for a path', () => {
    expect(nestedToolPaths(toolById('home'))).toEqual(['/deal/', '/judge/', '/docs/'])
    expect(nestedToolPaths(toolById('deal'))).toEqual([])
    expect(toolForPath(tools, '/judge/x')?.id).toBe('judge')
    expect(toolForPath(tools, '/deal')?.id).toBe('deal')
    expect(toolForPath(tools, '/dealer/')?.id).toBe('home')
  })

  it('reports malformed entries', () => {
    const problems = validateTools([
      tool('home'),
      tool('a'),
      tool('a'),
      { ...tool('Bad'), path: '/bad/' },
      { ...tool('b'), icon: 'IconX' },
      { ...tool('c'), name: { 'zh-TW': '', 'en-US': 'c' } },
    ])
    expect(problems).toEqual(
      expect.arrayContaining([
        'duplicate id: a',
        'duplicate path: /a/',
        'Bad: id must be lowercase letters, digits, dashes',
        'Bad: path must be /Bad/ (got /bad/)',
        'b: icon must be a Tabler icon name',
        'c: name.zh-TW is required',
      ]),
    )
    expect(validateTools([tool('a')])).toContain('home is required')
  })
})
