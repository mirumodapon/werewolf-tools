import { DEFAULT_RULES } from '@werewolf/rules'
import { beforeEach, describe, expect, it } from 'vite-plus/test'
import { filterGames } from './filter.ts'
import { nextSeq, parseGame, SCHEMA_VERSION, winnerOf, type JudgeGame } from './game.ts'
import { createLocalRepository, openIndexedDbRepository } from './repository.ts'
import { decodeGame, encodeGame, fileName, ImportError, parseBackup } from './transfer.ts'

const day = new Date(2026, 10, 22, 20).getTime()
const game = (id: string, extra: Partial<JudgeGame> = {}): JudgeGame => ({
  schemaVersion: SCHEMA_VERSION,
  id,
  createdAt: day,
  updatedAt: day,
  name: '',
  seq: 1,
  note: '',
  board: {
    id: 'b8-seer-witch-hunter',
    name: { 'zh-TW': '預女獵', 'en-US': 'SWH' },
    roles: { werewolf: 1, seer: 1, villager: 6 },
    rules: { ...DEFAULT_RULES, sheriff: false },
    verified: false,
  },
  table: [
    { seat: 1, role: 'werewolf' },
    { seat: 2, role: 'seer' },
  ],
  options: {},
  events: [],
  ...extra,
})

describe('games', () => {
  it('number the games of each day', () => {
    expect(nextSeq([], day)).toBe(1)
    expect(
      nextSeq([game('a', { seq: 2 }), game('b', { seq: 1, createdAt: day - 86400000 * 3 })], day),
    ).toBe(3)
  })

  it('derive the winner from the inputs', () => {
    const won = game('a', {
      events: [
        { step: 'dusk' },
        { step: 'wolves', kill: 3 },
        { step: 'seer', target: 1 },
        { step: 'deaths' },
        { step: 'day', action: 'vote', exiled: 1 },
      ],
    })
    expect(winnerOf(won)).toBe('good')
    expect(winnerOf(game('b'))).toBeNull()
  })

  it('filter by text and result', () => {
    const list = [
      game('a', { note: '在咖啡廳', events: [{ step: 'end', winner: 'wolf' }] }),
      game('b', { name: '週五局' }),
    ]
    const name = (g: JudgeGame) => g.name || 'auto'
    expect(
      filterGames(list, { text: '咖啡', result: 'all' }, name, 'zh-TW').map((g) => g.id),
    ).toEqual(['a'])
    expect(
      filterGames(list, { text: '', result: 'ongoing' }, name, 'zh-TW').map((g) => g.id),
    ).toEqual(['b'])
    expect(filterGames(list, { text: '', result: 'wolf' }, name, 'zh-TW').map((g) => g.id)).toEqual(
      ['a'],
    )
  })

  it('refuse what is not a game', () => {
    expect(parseGame({ id: 'x' })).toBeNull()
    expect(
      parseGame({ ...game('a'), board: { ...game('a').board, rules: undefined } })?.board.rules,
    ).toEqual(DEFAULT_RULES)
  })
})

describe('transfer', () => {
  it('round-trips a game through a link', async () => {
    const g = game('a', { events: [{ step: 'dusk' }] })
    expect(await decodeGame(await encodeGame(g))).toEqual(g)
  })

  it('reads one game or many from a backup and names the bad entry', () => {
    expect(parseBackup(JSON.stringify(game('a')))).toHaveLength(1)
    expect(parseBackup(JSON.stringify([game('a'), game('b')]))).toHaveLength(2)
    expect(() => parseBackup('[{}]')).toThrow(new ImportError('entry 1 is not a game'))
    expect(() => parseBackup('nope')).toThrow(ImportError)
  })

  it('makes safe file names', () => {
    expect(fileName('2026-11-22 第3場')).toBe('2026-11-22_第3場.json')
    expect(fileName('a/b:c')).toBe('a_b_c.json')
  })
})

describe('repositories', () => {
  beforeEach(() => localStorage.clear())
  for (const [name, open] of [
    ['IndexedDB', () => openIndexedDbRepository(`test-${Math.random()}`)],
    ['localStorage', async () => createLocalRepository()],
  ] as const) {
    it(`store games in ${name}`, async () => {
      const repo = await open()
      await repo.putMany([game('a', { createdAt: day - 1 }), game('b')])
      await repo.put({ ...game('a', { createdAt: day - 1 }), note: 'x' })
      expect((await repo.list()).map((g) => g.id)).toEqual(['b', 'a'])
      expect((await repo.get('a'))?.note).toBe('x')
      await repo.delete('a')
      expect(await repo.get('a')).toBeUndefined()
    })
  }
})
