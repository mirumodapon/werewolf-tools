import { flushPromises, mount } from '@vue/test-utils'
import { DEFAULT_RULES } from '@werewolf/rules'
import { installWerewolf } from '@werewolf/ui'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createMemoryHistory } from 'vue-router'
import App from './App.vue'
import { createLocalRepository, setRepository } from './games/repository.ts'
import { messages } from './locales/index.ts'
import { createJudgeRouter, setPendingHandoff } from './router.ts'

async function mountJudge(path = '/') {
  const router = createJudgeRouter(createMemoryHistory())
  await router.push(path)
  const w = mount(App, {
    global: { plugins: [{ install: (app) => installWerewolf(app, 'judge', messages) }, router] },
    attachTo: document.body,
  })
  await flushPromises()
  return { w, router }
}

const seat = (w: Awaited<ReturnType<typeof mountJudge>>['w'], n: number) =>
  w
    .find(`[data-testid="step-title"]`)
    .element.parentElement!.querySelector<HTMLButtonElement>(`[data-testid="seat-${n}"]`)!
async function start(
  w: Awaited<ReturnType<typeof mountJudge>>['w'],
  router: Awaited<ReturnType<typeof mountJudge>>['router'],
) {
  await w.find('[data-testid="start"]').trigger('click')
  await vi.waitFor(() => expect(router.currentRoute.value.path).toMatch(/^\/play\//))
  await vi.waitFor(() => expect(w.find('[data-testid="step-title"]').exists()).toBe(true))
}

async function next(w: Awaited<ReturnType<typeof mountJudge>>['w']) {
  await w.find('[data-testid="submit"]').trigger('click')
  await flushPromises()
}

describe('judge', () => {
  beforeEach(() => {
    localStorage.clear()
    setRepository(createLocalRepository())
  })

  it('runs night one from a handed-over deal and announces a peaceful night', async () => {
    // 1 狼人 2 狼人 3 狼人 4 預言家 5 女巫 6 獵人 7–8 村民
    const roles = [
      'werewolf',
      'werewolf',
      'werewolf',
      'seer',
      'witch',
      'hunter',
      'villager',
      'villager',
    ] as const
    setPendingHandoff({
      boardId: 'b8-seer-witch-hunter',
      boardName: { 'zh-TW': '預女獵', 'en-US': 'SWH' },
      roles: { werewolf: 3, seer: 1, witch: 1, hunter: 1, villager: 2 },
      rules: { ...DEFAULT_RULES, win: 'city', sheriff: false },
      table: roles.map((role, i) => ({ seat: i + 1, role })),
    })
    const { w, router } = await mountJudge('/new')
    expect(w.text()).toContain('已從角色發牌帶入座位與角色')
    expect(w.find('[data-testid="unverified"]').exists()).toBe(true)
    await start(w, router)
    expect(w.find('[data-testid="phase"]').text()).toBe('第 1 夜')

    await next(w) // 天黑請閉眼
    expect(w.find('[data-testid="step-title"]').text()).toContain('狼人')
    seat(w, 7).click()
    await flushPromises()
    await next(w)
    expect(w.find('[data-testid="script"]').text()).toContain('今晚 7 號玩家被殺')
    await w.find('[data-testid="witch-save"]').trigger('click')
    await next(w)
    seat(w, 1).click()
    await flushPromises()
    expect(w.find('[data-testid="seer-result"]').text()).toContain('狼人')
    await next(w)
    expect(w.find('[data-testid="hunter-status"]').text()).toContain('可以開槍')
    await next(w)
    expect(w.find('[data-testid="phase"]').text()).toBe('第 1 天')
    expect(w.find('[data-testid="script"]').text()).toContain('昨晚是平安夜')

    await w.find('[data-testid="undo"]').trigger('click')
    await flushPromises()
    await document.querySelector<HTMLButtonElement>('[data-testid="confirm-ok"]')!.click()
    await flushPromises()
    expect(w.find('[data-testid="phase"]').text()).toBe('第 1 夜')
    w.unmount()
  })

  it('asks who holds each role when the cards are unknown', async () => {
    const { w, router } = await mountJudge('/new')
    await w.find('[data-testid="count-8"]').trigger('click')
    await flushPromises()
    await start(w, router)
    await next(w) // dusk
    expect(w.text()).toContain('狼人是哪幾號？（共 3 位睜眼）')
    for (const n of [1, 2, 3]) seat(w, n).click()
    await flushPromises()
    seat(w, 8).click()
    await flushPromises()
    await next(w)
    expect(w.text()).toContain('女巫是幾號？')
    w.unmount()
  })

  it('lists saved games', async () => {
    const first = await mountJudge('/new')
    await first.w.find('[data-testid="count-8"]').trigger('click')
    await flushPromises()
    await first.w.find('[data-testid="start"]').trigger('click')
    await flushPromises()
    first.w.unmount()
    const { w } = await mountJudge('/')
    expect(w.findAll('[data-testid="game"]')).toHaveLength(1)
    expect(w.find('[data-testid="game"]').text()).toContain('第1場')
    w.unmount()
  })
})
