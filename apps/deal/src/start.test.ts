import { flushPromises } from '@vue/test-utils'
import { encodeBoard } from '@werewolf/boards'
import { SMALL_TABLE_RULES } from '@werewolf/rules'
import { describe, expect, it, vi } from 'vite-plus/test'
import { startDeal } from './start.ts'

describe('opening a shared board link', () => {
  it('opens the import preview', async () => {
    localStorage.clear()
    const payload = await encodeBoard({
      name: '分享的板子',
      roles: { werewolf: 3, seer: 1, witch: 1, hunter: 1, villager: 2 },
      rules: SMALL_TABLE_RULES,
    })
    history.replaceState(null, '', `/deal/?b=${payload}`)
    const el = document.createElement('div')
    document.body.append(el)
    const { app, router } = startDeal(el)
    await router.isReady()
    for (let i = 0; i < 5; i++) await flushPromises()
    await vi.waitFor(() => expect(el.querySelector('[data-testid="import"]')).not.toBeNull())
    expect(router.currentRoute.value.path).toBe('/import')
    expect(el.textContent).toContain('分享的板子')
    expect(location.search).toBe('')
    app.unmount()
  })
})
