import { toolById } from '@werewolf/registry'
import { describe, expect, it } from 'vite-plus/test'
import {
  cleanupScript,
  createPwaConfig,
  FILE_PATH,
  iconSvg,
  pathPattern,
  repoVersion,
} from './index.ts'

describe('createPwaConfig', () => {
  it('scopes each tool to its own path', () => {
    const config = createPwaConfig(toolById('judge'))
    expect(config.manifest).toMatchObject({
      id: '/judge/',
      scope: '/judge/',
      start_url: '/judge/',
      name: '狼人殺・法官輔助',
    })
    expect(config.workbox?.cacheId).toBe('werewolf-judge')
  })

  it('keeps home away from nested tools and the docs', () => {
    const deny = createPwaConfig(toolById('home')).workbox!.navigateFallbackDenylist!
    for (const path of ['/deal/', '/judge/x', '/docs/rules/night'])
      expect(deny.some((re) => re.test(path))).toBe(true)
    expect(deny.some((re) => re.test('/'))).toBe(false)
  })

  it('matches tool paths and file paths', () => {
    expect(pathPattern('/deal/').test('/deal')).toBe(true)
    expect(pathPattern('/deal/').test('/dealer/')).toBe(false)
    expect(FILE_PATH.test('/deal/licenses.txt')).toBe(true)
    expect(FILE_PATH.test('/deal/')).toBe(false)
  })
})

describe('assets', () => {
  it('only cleans caches of other ids at this scope', () => {
    expect(cleanupScript('werewolf-home')).toContain('"werewolf-home-precache-"')
  })

  it('draws the icon in the accent', () => {
    expect(iconSvg('<path stroke="currentColor"/>', 'red')).toContain('stroke="#f7768e"')
  })

  it('reads the repo version', () => {
    expect(repoVersion()).toMatch(/^0\.0\.\d+$/)
  })
})
