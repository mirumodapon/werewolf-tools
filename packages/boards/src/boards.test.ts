import { mount } from '@vue/test-utils'
import { createWerewolfI18n } from '@werewolf/i18n'
import { DEFAULT_RULES, SMALL_TABLE_RULES } from '@werewolf/rules'
import { ShareError } from '@werewolf/share'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vite-plus/test'
import {
  BOARDS_STORE,
  decodeBoard,
  encodeBoard,
  parseCustomBoard,
  useBoardsStore,
} from './index.ts'
import BoardPicker from './components/BoardPicker.vue'

describe('board links', () => {
  it('round-trip name, cards and rules', async () => {
    const board = {
      name: '12 人自訂',
      roles: { werewolf: 4, seer: 1, witch: 1, villager: 6 },
      rules: SMALL_TABLE_RULES,
    }
    const payload = await encodeBoard(board)
    expect(await decodeBoard(payload)).toEqual(board)
  })

  it('reject other payloads', async () => {
    await expect(decodeBoard('garbage!')).rejects.toBeInstanceOf(ShareError)
  })
})

describe('custom boards', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('are stored in the global scope and never verified', () => {
    const store = useBoardsStore()
    const id = store.save({
      name: ' 我的板 ',
      roles: { werewolf: 3, seer: 1, villager: 0, witch: 1 },
      rules: DEFAULT_RULES,
    })
    expect(BOARDS_STORE.key).toBe('werewolf:global:boards')
    expect(store.byId(id)).toMatchObject({
      name: '我的板',
      roles: { werewolf: 3, seer: 1, witch: 1 },
      verified: false,
      builtin: false,
    })
    store.remove(id)
    expect(store.customs).toEqual([])
  })

  it('fill in rules for boards saved without them', () => {
    expect(
      parseCustomBoard({ id: 'x', name: 'n', roles: { werewolf: 3, thief: 1 } }),
    ).toMatchObject({
      roles: { werewolf: 3 },
      rules: DEFAULT_RULES,
    })
    expect(parseCustomBoard({ name: 'no id' })).toBeNull()
  })

  it('list built-in boards first for a player count', () => {
    const store = useBoardsStore()
    store.save({
      name: 'c',
      roles: { werewolf: 4, seer: 1, witch: 1, hunter: 1, guard: 1, villager: 4 },
      rules: DEFAULT_RULES,
    })
    const twelve = store.forCount(12)
    expect(twelve[0]?.builtin).toBe(true)
    expect(twelve.at(-1)?.name).toBe('c')
  })
})

describe('BoardPicker', () => {
  it('selects a board of the chosen size and marks it unverified', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    let boardId: string | null = null
    const w = mount(BoardPicker, {
      global: { plugins: [pinia, createWerewolfI18n(undefined, 'zh-TW')] },
      props: { count: 8, boardId, 'onUpdate:boardId': (v: string | null) => (boardId = v) },
    })
    await w.vm.$nextTick()
    expect(boardId).toBe('b8-seer-witch-hunter')
    expect(w.find('[data-testid="unverified"]').text()).toContain('未驗證')
  })
})
