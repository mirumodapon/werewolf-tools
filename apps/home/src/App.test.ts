import { flushPromises, mount } from '@vue/test-utils'
import { installWerewolf, LAUNCHER_KEY } from '@werewolf/ui'
import { describe, expect, it } from 'vite-plus/test'
import { createMemoryHistory } from 'vue-router'
import App from './App.vue'
import { inlineParts, parseChangelog } from './changelog.ts'
import { messages } from './locales/index.ts'
import { createHomeRouter } from './router.ts'

async function mountHome(path = '/') {
  const router = createHomeRouter(createMemoryHistory())
  await router.push(path)
  const w = mount(App, {
    global: { plugins: [{ install: (app) => installWerewolf(app, 'home', messages) }, router] },
  })
  await flushPromises()
  return { w, router }
}

describe('home', () => {
  it('lists the tools, every one alpha', async () => {
    const { w } = await mountHome()
    expect(w.find('[data-testid="tool-deal"]').attributes('href')).toBe('/deal/')
    expect(w.find('[data-testid="tool-judge"]').text()).toContain('法官輔助')
    expect(w.findAll('[data-testid="status-alpha"]').length).toBe(4)
  })

  it('marks the tools it opens, so their titles lead back home', async () => {
    const { w } = await mountHome()
    await w.find('[data-testid="tool-judge"]').trigger('click')
    expect(sessionStorage.getItem(LAUNCHER_KEY)).toBe('home')
  })

  it('shows the three newest releases and links to the full changelog', async () => {
    const { w } = await mountHome('/info')
    expect(w.find('[data-testid="changelog"]').text()).toContain('0.0.1')
    expect(w.find('[data-testid="full-changelog"]').attributes('href')).toBe('/docs/changelog')
  })
})

describe('parseChangelog', () => {
  const md =
    '# 更新紀錄\n\n## 0.0.4\n\n- d\n\n## 0.0.3\n\n### 工具\n\n- c\n  - nested `x`\n\n## 0.0.2\n\n- b\n\n## 0.0.1\n\n- a\n'

  it('keeps only the newest versions', () => {
    const blocks = parseChangelog(md, 3)
    expect(blocks.filter((b) => b.kind === 'version').map((b) => b.text)).toEqual([
      '0.0.4',
      '0.0.3',
      '0.0.2',
    ])
    expect(blocks).toContainEqual({ kind: 'item', text: 'nested `x`', depth: 1 })
  })

  it('splits code spans', () => {
    expect(inlineParts('a `b` c')).toEqual([
      { code: false, text: 'a ' },
      { code: true, text: 'b' },
      { code: false, text: ' c' },
    ])
  })
})
