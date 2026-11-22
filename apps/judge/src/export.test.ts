import { flushPromises, mount } from '@vue/test-utils'
import { DEFAULT_RULES } from '@werewolf/rules'
import { installWerewolf } from '@werewolf/ui'
import { describe, expect, it, vi } from 'vite-plus/test'
import { createMemoryHistory } from 'vue-router'
import App from './App.vue'
import { createLocalRepository, setRepository } from './games/repository.ts'
import { createJudgeRouter } from './router.ts'
import { defineComponent, h } from 'vue'
import { SCHEMA_VERSION, type JudgeGame } from './games/game.ts'
import { messages } from './locales/index.ts'
import { useGameExport } from './useGameExport.ts'

const game: JudgeGame = {
  schemaVersion: SCHEMA_VERSION,
  id: 'g1',
  createdAt: new Date(2026, 10, 23, 20).getTime(),
  updatedAt: 0,
  name: '週五局',
  seq: 1,
  note: '咖啡廳',
  board: {
    id: null,
    name: '小局',
    roles: { werewolf: 1, seer: 1, villager: 6 },
    rules: { ...DEFAULT_RULES, sheriff: false },
    verified: false,
  },
  table: [
    { seat: 1, role: 'werewolf' },
    { seat: 2, role: 'seer' },
    ...[3, 4, 5, 6, 7, 8].map((seat) => ({ seat, role: 'villager' as const })),
  ],
  options: {},
  events: [
    { step: 'dusk' },
    { step: 'wolves', kill: 3 },
    { step: 'seer', target: 1 },
    { step: 'deaths' },
    { step: 'day', action: 'vote', exiled: 1 },
  ],
}

function exportText(): string {
  let text = ''
  const Probe = defineComponent(() => {
    text = useGameExport().text(game)
    return () => h('div')
  })
  mount(Probe, {
    global: { plugins: [{ install: (app) => installWerewolf(app, 'judge', messages) }] },
  })
  return text
}

describe('text export', () => {
  it('lists the result, settings, seats and what happened each night and day', () => {
    const text = exportText()
    expect(text.split('\n')[0]).toBe('週五局')
    expect(text).toContain('結果：好人陣營勝利')
    expect(text).toContain('備註：咖啡廳')
    expect(text).toContain('【座位表】')
    expect(text).toContain('1 號　狼人　被放逐（第 1 天）')
    expect(text).toContain('3 號　村民　被狼人殺害（第 1 夜）')
    expect(text).toContain('2 號　預言家　存活')
    expect(text).toContain('【第 1 夜】')
    expect(text).toContain('預言家查驗 1 號：狼人')
    expect(text).toContain('【第 1 天】')
    expect(text).toContain('1 號 被放逐')
  })
})

describe('export sheet', () => {
  it('offers text, JSON and an import link (no QR code)', async () => {
    localStorage.clear()
    const repo = createLocalRepository()
    await repo.put(game)
    setRepository(repo)
    const router = createJudgeRouter(createMemoryHistory())
    await router.push('/games/g1')
    const w = mount(App, {
      global: { plugins: [{ install: (app) => installWerewolf(app, 'judge', messages) }, router] },
    })
    await vi.waitFor(() => expect(w.find('[data-testid="export"]').exists()).toBe(true))
    await w.find('[data-testid="export"]').trigger('click')
    await flushPromises()
    expect((w.find('[data-testid="export-text"]').element as HTMLTextAreaElement).value).toContain(
      '結果：好人陣營勝利',
    )
    await w.find('[role="radio"]:nth-child(2)').trigger('click')
    await flushPromises()
    expect((w.find('[data-testid="export-json"]').element as HTMLTextAreaElement).value).toContain(
      '"schemaVersion": 1',
    )
    await w.find('[role="radio"]:nth-child(4)').trigger('click')
    await vi.waitFor(() =>
      expect((w.find('[data-testid="export-link"]').element as HTMLInputElement).value).toContain(
        '?s=',
      ),
    )
    expect(w.find('[data-testid="share-qr"]').exists()).toBe(false)
    w.unmount()
    setRepository(null)
  })
})

describe('shared link preview', () => {
  it('shows the whole game before importing it', async () => {
    localStorage.clear()
    setRepository(createLocalRepository())
    const { encodeGame } = await import('./games/transfer.ts')
    const router = createJudgeRouter(createMemoryHistory())
    await router.push(`/import?s=${await encodeGame(game)}`)
    const w = mount(App, {
      global: { plugins: [{ install: (app) => installWerewolf(app, 'judge', messages) }, router] },
    })
    await vi.waitFor(() => expect(w.find('[data-testid="shared-game"]').exists()).toBe(true))
    expect(w.find('[data-testid="shared-game"]').text()).toContain('週五局')
    expect(w.find('[data-testid="shared-result"]').text()).toBe('好人陣營勝利')
    expect(w.find('[data-testid="shared-game"]').text()).toContain('備註：咖啡廳')
    expect(w.find('[data-testid="seat-table"]').text()).toContain('被放逐')
    expect(w.find('[data-testid="timeline"]').text()).toContain('預言家查驗 1 號：狼人')
    await w.find('[data-testid="import"]').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toMatch(/^\/games\//))
    w.unmount()
    setRepository(null)
  })
})
