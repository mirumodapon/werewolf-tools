import { describe, expect, it } from 'vite-plus/test'
import { DEFAULT_RULES, type BoardRules } from '../boardRules.ts'
import type { RoleId } from '../roles.ts'
import { countRoles, type SeatRole } from '../table.ts'
import { deriveGame } from './derive.ts'
import { checkWinner, seerResult } from './engine.ts'
import type { GameEvent, JudgeSetup } from './types.ts'

/** A setup whose cards are all known, seat by seat. */
function known(roles: RoleId[], rules: Partial<BoardRules> = {}): JudgeSetup {
  const table: SeatRole[] = roles.map((role, i) => ({ seat: i + 1, role }))
  return { roles: countRoles(table), rules: { ...DEFAULT_RULES, ...rules }, table }
}

// 1–4 狼人, 5 預言家, 6 女巫, 7 獵人, 8 守衛, 9–12 村民
const GUARD_BOARD: RoleId[] = [
  'werewolf',
  'werewolf',
  'werewolf',
  'werewolf',
  'seer',
  'witch',
  'hunter',
  'guard',
  'villager',
  'villager',
  'villager',
  'villager',
]

/** Night 1 of GUARD_BOARD with the given choices, up to the sheriff vote. */
function night({
  guard = null,
  kill = null,
  save = false,
  poison = null,
  check = null,
}: {
  guard?: number | null
  kill?: number | null
  save?: boolean
  poison?: number | null
  check?: number | null
} = {}): GameEvent[] {
  return [
    { step: 'dusk' },
    { step: 'guard', target: guard },
    { step: 'wolves', kill },
    { step: 'witch', save, poison },
    { step: 'seer', target: check },
    { step: 'hunter' },
  ]
}

const ids = (setup: JudgeSetup, events: GameEvent[]) => {
  const g = deriveGame(setup, events)
  expect(g.error).toBeNull()
  return g
}

describe('night plan', () => {
  it('calls the roles of the board in order', () => {
    const g = ids(known(GUARD_BOARD), [])
    expect(g.state.plan.map((p) => p.id)).toEqual([
      'dusk',
      'guard',
      'wolves',
      'witch',
      'seer',
      'hunter',
    ])
    expect(g.step?.id).toBe('dusk')
  })

  it('adds first-night roles and identification when cards are unknown', () => {
    const setup: JudgeSetup = {
      roles: {
        werewolf: 3,
        wolfKing: 1,
        seer: 1,
        witch: 1,
        hunter: 1,
        idiot: 1,
        cupid: 1,
        villager: 3,
      },
      rules: DEFAULT_RULES,
      table: [],
    }
    const plan = deriveGame(setup, []).state.plan.map((p) =>
      p.id === 'identify' ? `identify:${p.role}` : p.id,
    )
    expect(plan).toEqual([
      'dusk',
      'cupid',
      'lovers',
      'wolves',
      'identify:wolfKing',
      'witch',
      'seer',
      'hunter',
      'identify:idiot',
    ])
  })
})

describe('night deaths', () => {
  const setup = known(GUARD_BOARD)
  const day = (events: GameEvent[]) => ids(setup, [...events, { step: 'sheriff', seat: 9 }]).step

  it('announces a peaceful night when the guard protects the victim', () => {
    expect(day(night({ guard: 10, kill: 10 }))?.deaths).toEqual({ seats: [], lastWords: [] })
  })

  it('kills when guarded and saved on the same night (同守同救)', () => {
    expect(day(night({ guard: 10, kill: 10, save: true }))?.deaths?.seats).toEqual([10])
    const lenient = known(GUARD_BOARD, { guardSaveConflict: 'lives' })
    const g = ids(lenient, [
      ...night({ guard: 10, kill: 10, save: true }),
      { step: 'sheriff', seat: null },
    ])
    expect(g.step?.deaths?.seats).toEqual([])
  })

  it('lists the victim and the poisoned in seat order, with first-night last words', () => {
    expect(day(night({ kill: 11, poison: 2 }))?.deaths).toEqual({
      seats: [2, 11],
      lastWords: [2, 11],
    })
  })

  it('tells the witch the victim only while she has the antidote', () => {
    const g = ids(setup, night({ kill: 9 }).slice(0, 3))
    expect(g.step?.witch).toMatchObject({ victim: 9, told: true, canSave: true })
  })

  it('lets the witch save herself on the first night only (default rule)', () => {
    const first = ids(setup, night({ kill: 6 }).slice(0, 3))
    expect(first.step?.witch?.canSave).toBe(true)
    const never = ids(
      known(GUARD_BOARD, { witchSelfSave: 'never' }),
      night({ kill: 6 }).slice(0, 3),
    )
    expect(never.step?.witch?.canSave).toBe(false)
  })

  it('refuses both potions on one night and repeating the guard', () => {
    const both = deriveGame(setup, night({ kill: 9, save: true, poison: 1 }))
    expect(both.error?.message).toBe('only one potion a night')
    const again = deriveGame(setup, [
      ...night({ guard: 9, kill: 10, save: true }),
      { step: 'sheriff', seat: null },
      { step: 'deaths' },
      { step: 'day', action: 'vote', exiled: null },
      { step: 'dusk' },
      { step: 'guard', target: 9 },
    ])
    expect(again.error?.message).toBe('cannot guard the same seat twice in a row')
  })

  it('shows the seer the truth', () => {
    const g = ids(setup, night().slice(0, 4))
    expect(seerResult(g.state, 1)).toBe('wolf')
    expect(seerResult(g.state, 9)).toBe('good')
  })
})

describe('day', () => {
  const setup = known(GUARD_BOARD)

  it('elects the sheriff before the deaths on day 1, then lets the dead sheriff pass the badge', () => {
    const g = ids(setup, [...night({ kill: 9 }), { step: 'sheriff', seat: 9 }, { step: 'deaths' }])
    expect(g.step).toMatchObject({ id: 'badge', badgeFrom: 9 })
    const after = ids(setup, [
      ...night({ kill: 9 }),
      { step: 'sheriff', seat: 9 },
      { step: 'deaths' },
      { step: 'badge', to: 5 },
    ])
    expect(after.state.sheriff).toBe(5)
    expect(after.step?.id).toBe('day')
  })

  it('lets a hunter killed by wolves shoot, but not a poisoned one', () => {
    const shot = ids(setup, [
      ...night({ kill: 7 }),
      { step: 'sheriff', seat: null },
      { step: 'deaths' },
    ])
    expect(shot.step).toMatchObject({ id: 'shoot', shooter: 7 })
    const afterShot = ids(setup, [
      ...night({ kill: 7 }),
      { step: 'sheriff', seat: null },
      { step: 'deaths' },
      { step: 'shoot', target: 1 },
    ])
    expect(afterShot.state.players[0]?.death).toEqual({ cause: 'shot', round: 1, phase: 'day' })
    const poisoned = ids(setup, [
      ...night({ poison: 7 }),
      { step: 'sheriff', seat: null },
      { step: 'deaths' },
    ])
    expect(poisoned.step?.id).toBe('day')
  })

  it('moves to night 2 after the vote', () => {
    const g = ids(setup, [
      ...night({ kill: 9 }),
      { step: 'sheriff', seat: null },
      { step: 'deaths' },
      { step: 'day', action: 'vote', exiled: 1 },
    ])
    expect(g.state).toMatchObject({ phase: 'night', round: 2, lastExiled: 1 })
    expect(g.step?.id).toBe('dusk')
  })

  it('stops the witch from hearing the victim once the antidote is used', () => {
    const g = ids(setup, [
      ...night({ kill: 9, save: true }),
      { step: 'sheriff', seat: null },
      { step: 'deaths' },
      { step: 'day', action: 'vote', exiled: null },
      { step: 'dusk' },
      { step: 'guard', target: null },
      { step: 'wolves', kill: 10 },
    ])
    expect(g.step?.witch).toMatchObject({ told: false, victim: null, canSave: false })
  })

  it('ends 屠邊 when every god is out', () => {
    const g = ids(
      known(
        [
          'werewolf',
          'werewolf',
          'werewolf',
          'seer',
          'villager',
          'villager',
          'villager',
          'villager',
        ],
        { sheriff: false },
      ),
      [
        { step: 'dusk' },
        { step: 'wolves', kill: 4 },
        { step: 'seer', target: null },
        { step: 'deaths' },
      ],
    )
    expect(g.state).toMatchObject({ phase: 'ended', winner: 'wolf' })
    expect(g.step).toBeNull()
  })

  it('ends with the good side when the last wolf is exiled', () => {
    const g = ids(
      known(
        [
          'werewolf',
          'seer',
          'villager',
          'villager',
          'villager',
          'villager',
          'villager',
          'villager',
        ],
        { sheriff: false },
      ),
      [
        { step: 'dusk' },
        { step: 'wolves', kill: 3 },
        { step: 'seer', target: 1 },
        { step: 'deaths' },
        { step: 'day', action: 'vote', exiled: 1 },
      ],
    )
    expect(g.state.winner).toBe('good')
  })

  it('reveals the idiot instead of exiling him the first time', () => {
    const setup = known(
      [
        'werewolf',
        'werewolf',
        'werewolf',
        'seer',
        'witch',
        'hunter',
        'idiot',
        'villager',
        'villager',
        'villager',
      ],
      { sheriff: false },
    )
    const g = ids(setup, [
      { step: 'dusk' },
      { step: 'wolves', kill: null },
      { step: 'witch' },
      { step: 'seer', target: null },
      { step: 'hunter' },
      { step: 'deaths' },
      { step: 'day', action: 'vote', exiled: 7 },
    ])
    expect(g.state.players[6]?.alive).toBe(true)
    expect(g.state.idiotRevealed).toBe(true)
  })

  it('handles the knight: a won duel ends the day, a lost one costs the knight', () => {
    const board: RoleId[] = [
      'werewolf',
      'werewolf',
      'werewolf',
      'whiteWolfKing',
      'seer',
      'witch',
      'knight',
      'guard',
      'villager',
      'villager',
      'villager',
      'villager',
    ]
    const start: GameEvent[] = [
      { step: 'dusk' },
      { step: 'guard', target: null },
      { step: 'wolves', kill: null },
      { step: 'witch' },
      { step: 'seer', target: null },
      { step: 'sheriff', seat: null },
      { step: 'deaths' },
    ]
    const won = ids(known(board), [...start, { step: 'day', action: 'duel', actor: 7, target: 1 }])
    expect(won.state).toMatchObject({ phase: 'night', round: 2 })
    const lost = ids(known(board), [...start, { step: 'day', action: 'duel', actor: 7, target: 9 }])
    expect(lost.state.players[6]?.death?.cause).toBe('duelLost')
    expect(lost.step?.id).toBe('day')
    const exploded = ids(known(board), [
      ...start,
      { step: 'day', action: 'explode', actor: 4, target: 5 },
    ])
    expect(exploded.state.players[4]?.death?.cause).toBe('blast')
    expect(exploded.state).toMatchObject({ phase: 'night', round: 2 })
  })
})

describe('special roles', () => {
  it('kills the other lover, and a cross-faction couple plays for itself', () => {
    const roles: RoleId[] = [
      'werewolf',
      'werewolf',
      'werewolf',
      'seer',
      'witch',
      'hunter',
      'cupid',
      'villager',
      'villager',
      'villager',
    ]
    const g = ids(known(roles, { sheriff: false }), [
      { step: 'dusk' },
      { step: 'cupid', lovers: [1, 8] },
      { step: 'lovers' },
      { step: 'wolves', kill: 8 },
      { step: 'witch' },
      { step: 'seer', target: null },
      { step: 'hunter' },
    ])
    expect(g.step?.deaths?.seats).toEqual([1, 8])
    expect(g.state.players[0]?.death?.cause).toBe('love')
  })

  it('takes the charmed player with 狼美人', () => {
    const roles: RoleId[] = [
      'werewolf',
      'werewolf',
      'werewolf',
      'wolfBeauty',
      'seer',
      'witch',
      'knight',
      'guard',
      'villager',
      'villager',
      'villager',
      'villager',
    ]
    const g = ids(known(roles, { sheriff: false }), [
      { step: 'dusk' },
      { step: 'guard', target: null },
      { step: 'wolves', kill: null },
      { step: 'wolfBeauty', target: 9 },
      { step: 'witch', poison: 4 },
      { step: 'seer', target: null },
    ])
    expect(g.step?.deaths?.seats).toEqual([4, 9])
    expect(g.state.players[8]?.death?.cause).toBe('charm')
  })

  it('redirects everything aimed at the two seats the magician swapped', () => {
    const roles: RoleId[] = [
      'werewolf',
      'werewolf',
      'werewolf',
      'wolfKing',
      'seer',
      'witch',
      'hunter',
      'magician',
      'villager',
      'villager',
      'villager',
      'villager',
    ]
    const g = ids(known(roles, { sheriff: false }), [
      { step: 'dusk' },
      { step: 'magician', swap: [9, 10] },
      { step: 'wolves', kill: 9 },
      { step: 'witch' },
      { step: 'seer', target: null },
      { step: 'hunter' },
    ])
    expect(g.step?.deaths?.seats).toEqual([10])
  })

  it('hides 隱狼 from the seer and lets it kill once the pack is gone', () => {
    const roles: RoleId[] = [
      'werewolf',
      'hiddenWolf',
      'seer',
      'witch',
      'villager',
      'villager',
      'villager',
      'villager',
    ]
    const setup = known(roles, { sheriff: false })
    const g = ids(setup, [
      { step: 'dusk' },
      { step: 'wolves', kill: null },
      { step: 'hiddenWolf' },
      { step: 'witch' },
    ])
    expect(seerResult(g.state, 2)).toBe('good')
    const later = ids(setup, [
      { step: 'dusk' },
      { step: 'wolves', kill: null },
      { step: 'hiddenWolf' },
      { step: 'witch', poison: 1 },
      { step: 'seer', target: null },
      { step: 'deaths' },
      { step: 'day', action: 'vote', exiled: null },
      { step: 'dusk' },
    ])
    expect(later.step?.wolves?.seats).toEqual([2])
    expect(checkWinner(later.state)).toBeNull()
  })

  it('turns 野孩子 into a wolf when the model dies', () => {
    const roles: RoleId[] = [
      'werewolf',
      'werewolf',
      'werewolf',
      'seer',
      'witch',
      'hunter',
      'wildChild',
      'villager',
      'villager',
      'villager',
    ]
    const g = ids(known(roles, { sheriff: false }), [
      { step: 'dusk' },
      { step: 'wildChild', target: 8 },
      { step: 'wolves', kill: 8 },
      { step: 'witch' },
      { step: 'seer', target: null },
      { step: 'hunter' },
    ])
    expect(g.state.wildChildTurned).toBe(true)
    expect(seerResult(g.state, 7)).toBe('wolf')
  })
})

describe('identifying cards on night 1', () => {
  const setup: JudgeSetup = {
    roles: { werewolf: 3, seer: 1, witch: 1, hunter: 1, idiot: 1, villager: 3 },
    rules: { ...DEFAULT_RULES, sheriff: false },
    table: [],
  }

  it('asks for each holder and makes the rest villagers', () => {
    const g = ids(setup, [
      { step: 'dusk' },
      { step: 'wolves', actors: [2, 5, 9], kill: 1 },
      { step: 'witch', actor: 3 },
      { step: 'seer', actor: 4, target: 5 },
      { step: 'hunter', actor: 1 },
      { step: 'identify', role: 'idiot', actor: 6 },
    ])
    expect(g.state.players.map((p) => p.role)).toEqual([
      'hunter',
      'werewolf',
      'witch',
      'seer',
      'werewolf',
      'idiot',
      'villager',
      'villager',
      'werewolf',
      'villager',
    ])
    expect(g.state.unassigned).toEqual([])
    expect(g.step).toMatchObject({ id: 'deaths' })
    expect(g.state.log).toContainEqual(
      expect.objectContaining({ kind: 'check', target: 5, result: 'wolf' }),
    )
  })

  it('refuses an input that does not fit and ignores what follows', () => {
    const g = deriveGame(setup, [{ step: 'dusk' }, { step: 'witch', actor: 3 }, { step: 'dusk' }])
    expect(g.error).toEqual({ index: 1, message: 'expected wolves, got witch' })
    expect(g.step?.id).toBe('wolves')
  })

  it('ends by hand at any time', () => {
    const g = ids(setup, [{ step: 'dusk' }, { step: 'end', winner: 'good' }])
    expect(g.state).toMatchObject({ phase: 'ended', winner: 'good' })
  })
})

describe('advanced options', () => {
  it('apply only to boards with their roles', async () => {
    const { optionsFor, resolveOptions, normalizeOptions } = await import('./options.ts')
    expect(optionsFor({ werewolf: 3, seer: 1, villager: 4 })).toEqual([])
    expect(optionsFor({ werewolf: 4, witch: 1, guard: 1, villager: 6 }).map((o) => o.id)).toEqual([
      'witchToldAfterAntidote',
      'guardSelf',
    ])
    expect(resolveOptions({ guardSelf: false })).toEqual({
      witchToldAfterAntidote: false,
      guardSelf: false,
    })
    expect(normalizeOptions({ guardSelf: 'yes', witchToldAfterAntidote: true, other: 1 })).toEqual({
      witchToldAfterAntidote: true,
    })
  })

  it('keep telling the witch the victim after the antidote when chosen', () => {
    const setup = { ...known(GUARD_BOARD), options: { witchToldAfterAntidote: true } }
    const g = ids(setup, [
      ...night({ kill: 9, save: true }),
      { step: 'sheriff', seat: null },
      { step: 'deaths' },
      { step: 'day', action: 'vote', exiled: null },
      { step: 'dusk' },
      { step: 'guard', target: null },
      { step: 'wolves', kill: 10 },
    ])
    expect(g.step?.witch).toMatchObject({ told: true, victim: 10, canSave: false })
  })

  it('stop the guard protecting himself when not allowed', () => {
    const allowed = deriveGame(known(GUARD_BOARD), [{ step: 'dusk' }, { step: 'guard', target: 8 }])
    expect(allowed.error).toBeNull()
    const refused = deriveGame({ ...known(GUARD_BOARD), options: { guardSelf: false } }, [
      { step: 'dusk' },
      { step: 'guard', target: 8 },
    ])
    expect(refused.error?.message).toBe('the guard cannot protect himself')
  })
})
