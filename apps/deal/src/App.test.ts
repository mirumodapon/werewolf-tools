import { flushPromises, mount } from '@vue/test-utils'
import { BOARDS_STORE } from '@werewolf/boards'
import { installWerewolf } from '@werewolf/ui'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createMemoryHistory } from 'vue-router'
import App from './App.vue'
import { createLocalStore, setRecordStore } from './history/store.ts'
import { messages } from './locales/index.ts'
import { createDealRouter } from './router.ts'

async function mountDeal() {
  const router = createDealRouter(createMemoryHistory())
  await router.push('/')
  const w = mount(App, {
    global: { plugins: [{ install: (app) => installWerewolf(app, 'deal', messages) }, router] },
    attachTo: document.body,
  })
  await flushPromises()
  return { w, router }
}

describe('deal', () => {
  beforeEach(() => {
    localStorage.clear()
    setRecordStore(createLocalStore())
    vi.useRealTimers()
  })

  it('marks the built-in boards unverified', async () => {
    const { w } = await mountDeal()
    expect(
      w
        .find('[data-testid="board-b12-seer-witch-hunter-idiot"] [data-testid="unverified"]')
        .exists(),
    ).toBe(true)
    w.unmount()
  })

  it('deals a whole table and then offers the moderator view', async () => {
    const { w, router } = await mountDeal()
    await w.find('[data-testid="count-8"]').trigger('click')
    await flushPromises()
    expect(w.find('[data-testid="start"]').attributes('disabled')).toBeUndefined()
    await w.find('[data-testid="start"]').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/deal'))
    await flushPromises()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
    expect(router.currentRoute.value.path).toBe('/deal')
    for (let seat = 1; seat <= 8; seat++) {
      expect(w.find('[data-testid="handoff"]').text()).toContain(`${seat} 號`)
      await w.find('[data-testid="card-back"]').trigger('pointerdown', { pointerType: 'touch' })
      vi.advanceTimersByTime(1000)
      await flushPromises()
      expect(w.find('[data-testid="role-card"]').exists()).toBe(true)
      vi.advanceTimersByTime(600)
      // A double tap anywhere on the screen, not on the card.
      document.body.dispatchEvent(new Event('pointerup', { bubbles: true }))
      vi.advanceTimersByTime(100)
      document.body.dispatchEvent(new Event('pointerup', { bubbles: true }))
      await flushPromises()
    }
    expect(w.text()).toContain('全部玩家都看過角色了')
    expect(w.find('[data-testid="to-judge"]').exists()).toBe(true)
    w.unmount()
  })

  it('reads custom boards from the shared global list', async () => {
    localStorage.setItem(
      BOARDS_STORE.key,
      JSON.stringify({
        version: 1,
        data: [
          {
            id: 'c1',
            name: '我的十三人',
            roles: { werewolf: 4, seer: 1, witch: 1, hunter: 1, guard: 1, villager: 5 },
          },
        ],
      }),
    )
    const { w } = await mountDeal()
    await w.find('[data-testid="count-13"]').trigger('click')
    await flushPromises()
    expect(w.find('[data-testid="board-c1"]').text()).toContain('我的十三人')
    expect(w.find('[data-testid="board-c1"] [data-testid="unverified"]').exists()).toBe(true)
    w.unmount()
  })
})
