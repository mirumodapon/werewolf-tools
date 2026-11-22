import { flushPromises } from '@vue/test-utils'
import { builtinBoard, expandRoles } from '@werewolf/rules'
import { encodeHandoff } from '@werewolf/boards'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { boardOf, SCHEMA_VERSION, type JudgeGame } from './games/game.ts'
import { createLocalRepository, setRepository } from './games/repository.ts'
import { encodeGame } from './games/transfer.ts'
import { startJudge } from './start.ts'

const board = builtinBoard('b8-seer-witch-hunter')!
const table = expandRoles(board.roles).map((role, i) => ({ seat: i + 1, role }))
const game: JudgeGame = {
  schemaVersion: SCHEMA_VERSION,
  id: 'g1',
  createdAt: Date.now(),
  updatedAt: 0,
  name: '分享的一局',
  seq: 1,
  note: '',
  board: boardOf(board),
  table,
  options: {},
  events: [{ step: 'dusk' }],
}

/** Opens the app the way a browser opens a shared link. */
async function open(url: string) {
  localStorage.clear()
  setRepository(createLocalRepository())
  history.replaceState(null, '', url)
  const el = document.createElement('div')
  document.body.append(el)
  const started = await startJudge(el)
  await started.router.isReady()
  for (let i = 0; i < 5; i++) await flushPromises()
  return { ...started, el }
}

describe('opening shared links', () => {
  let unmount: (() => void) | undefined
  afterEach(() => {
    unmount?.()
    setRepository(null)
  })

  it('opens the preview of a shared game', async () => {
    const { app, router, el } = await open(`/judge/?s=${await encodeGame(game)}`)
    unmount = () => app.unmount()
    await vi.waitFor(() => expect(el.querySelector('[data-testid="shared-game"]')).not.toBeNull())
    expect(router.currentRoute.value.path).toBe('/import')
    expect(el.textContent).toContain('分享的一局')
    expect(location.search).toBe('')
  })

  it('opens the setup of a deal handed over', async () => {
    const payload = await encodeHandoff({
      boardId: board.id,
      boardName: board.name,
      roles: board.roles,
      rules: board.rules,
      table,
    })
    const { app, router, el } = await open(`/judge/?t=${payload}`)
    unmount = () => app.unmount()
    await vi.waitFor(() =>
      expect(el.querySelector('[data-testid="advanced-options"]')).not.toBeNull(),
    )
    expect(router.currentRoute.value.path).toBe('/new')
  })
})
