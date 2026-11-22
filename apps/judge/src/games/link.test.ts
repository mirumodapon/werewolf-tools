import {
  builtinBoard,
  deriveGame,
  DEFAULT_RULES,
  expandRoles,
  type GameEvent,
} from '@werewolf/rules'
import { describe, expect, it } from 'vite-plus/test'
import { boardOf, SCHEMA_VERSION, setupOf, type JudgeGame } from './game.ts'
import { decodeGameLink, encodeGameLink, packGame, unpackGame } from './link.ts'

const board = builtinBoard('b12-seer-witch-hunter-guard')!
const table = expandRoles(board.roles).map((role, i) => ({ seat: i + 1, role }))

const game = (extra: Partial<JudgeGame> = {}): JudgeGame => ({
  schemaVersion: SCHEMA_VERSION,
  id: 'original',
  createdAt: new Date(2026, 10, 23, 20, 15).getTime(),
  updatedAt: 0,
  name: '週五局',
  seq: 3,
  note: '咖啡廳',
  board: boardOf(board),
  table,
  options: {},
  events: [],
  ...extra,
})

/** A played 12-player game: 3 nights and 3 days. */
const played: GameEvent[] = [
  { step: 'dusk' },
  { step: 'guard', target: 9 },
  { step: 'wolves', kill: 9 },
  { step: 'witch', save: false, poison: null },
  { step: 'seer', target: 1 },
  { step: 'hunter' },
  { step: 'sheriff', seat: 5 },
  { step: 'deaths' },
  { step: 'day', action: 'vote', exiled: 1 },
  { step: 'dusk' },
  { step: 'guard', target: 10 },
  { step: 'wolves', kill: 11 },
  { step: 'witch', save: true, poison: null },
  { step: 'seer', target: 2 },
  { step: 'hunter' },
  { step: 'deaths' },
  { step: 'day', action: 'vote', exiled: 2 },
  { step: 'dusk' },
  { step: 'guard', target: 5 },
  { step: 'wolves', kill: 12 },
  { step: 'witch', save: false, poison: 3 },
  { step: 'seer', target: 6 },
  { step: 'hunter' },
  { step: 'deaths' },
  { step: 'day', action: 'vote', exiled: 4 },
]

/** Every kind of input (not a playable game: only the encoding is checked). */
const everyKind: GameEvent[] = [
  { step: 'dusk' },
  { step: 'cupid', actor: 3, lovers: [1, 8] },
  { step: 'lovers' },
  { step: 'mixedBlood', actor: 4, target: 2 },
  { step: 'wildChild', actor: 5, target: 7 },
  { step: 'magician', actor: 6, swap: [9, 10] },
  { step: 'magician', swap: null },
  { step: 'guard', actor: 11, target: null },
  { step: 'wolves', actors: [1, 2, 3, 4], specials: { wolfKing: 2, whiteWolfKing: 4 }, kill: 12 },
  { step: 'wolves', kill: null },
  { step: 'identify', role: 'knight', actor: 7 },
  { step: 'wolfBeauty', actor: 3, target: 6 },
  { step: 'hiddenWolf', actor: 9 },
  { step: 'witch', actor: 5, save: true, poison: null },
  { step: 'witch', save: false, poison: 4 },
  { step: 'seer', actor: 8, target: 1 },
  { step: 'gravekeeper', actor: 10 },
  { step: 'crow', actor: 12, target: null },
  { step: 'hunter', actor: 2 },
  { step: 'sheriff', seat: null },
  { step: 'deaths' },
  { step: 'shoot', target: 3 },
  { step: 'badge', to: null },
  { step: 'day', action: 'vote', exiled: null },
  { step: 'day', action: 'explode', actor: 4, target: 6 },
  { step: 'day', action: 'duel', actor: 7, target: 2 },
  { step: 'assign', seat: 6, role: 'idiot' },
  { step: 'end', winner: 'third' },
]

describe('game links', () => {
  it('keep every kind of input', () => {
    const packed = packGame(game({ events: everyKind }))
    expect(packGame(unpackGame(packed))).toEqual(packed)
    expect(unpackGame(packed).events).toEqual([
      ...everyKind.slice(0, 7),
      { step: 'guard', actor: 11, target: null },
      ...everyKind.slice(8),
    ])
  })

  it('replay a played game to the same state, in a short link', async () => {
    const original = game({
      events: played,
      options: { witchSelfSave: 'always', guardSelf: false },
    })
    const payload = await encodeGameLink(original)
    const link = `https://werewolf.mirumo.net/judge/?s=${payload}`
    expect(link.length).toBeLessThan(300)
    const shared = await decodeGameLink(payload)
    expect(shared).toMatchObject({
      name: '週五局',
      seq: 3,
      note: '咖啡廳',
      createdAt: original.createdAt,
      board: { id: board.id, roles: board.roles, rules: board.rules },
      table,
      options: { witchSelfSave: 'always', guardSelf: false },
    })
    expect(shared.id).not.toBe('original')
    expect(deriveGame(setupOf(shared), shared.events).state).toEqual(
      deriveGame(setupOf(original), original.events).state,
    )
  })

  it('carry a custom board and unknown cards', async () => {
    const custom = game({
      board: {
        id: 'my-board',
        name: '我的板',
        roles: { werewolf: 3, seer: 1, villager: 4 },
        rules: { ...DEFAULT_RULES, sheriff: false },
        verified: false,
      },
      table: [],
    })
    const shared = await decodeGameLink(await encodeGameLink(custom))
    expect(shared.board).toEqual({
      id: null,
      name: '我的板',
      roles: custom.board.roles,
      rules: custom.board.rules,
      verified: false,
    })
    expect(shared.table).toEqual([])
  })

  it('send a built-in board with changed rules as a custom one', () => {
    const changed = game({ board: { ...boardOf(board), rules: { ...board.rules, win: 'city' } } })
    expect(typeof packGame(changed)[1]).not.toBe('string')
  })

  it('refuse broken links', async () => {
    await expect(decodeGameLink('jW10')).rejects.toThrow()
    expect(() => unpackGame([3, 'nope', 1, 1, '', '', '', [], []])).toThrow('unknown board')
    expect(() => unpackGame([3, board.id, 1, 1, '', '', '', [], [99]])).toThrow('unknown step')
    expect(() => unpackGame([3, board.id, 1, 1, '', '', '', [], [6, 1]])).toThrow(
      'truncated inputs',
    )
  })
})
