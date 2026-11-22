import { describe, expect, it } from 'vite-plus/test'
import { DEFAULT_RULES, normalizeRules } from './boardRules.ts'
import { BUILTIN_BOARDS, builtinBoard, isUnverified, MAX_PLAYERS, MIN_PLAYERS } from './boards.ts'
import { checkBoard, hasErrors } from './check.ts'
import { playerCount } from './table.ts'

describe('built-in boards', () => {
  it.each(BUILTIN_BOARDS.map((b) => [b.id, b] as const))('%s is valid', (id, board) => {
    const count = playerCount(board.roles)
    expect(id.startsWith(`b${count}-`)).toBe(true)
    expect(count).toBeGreaterThanOrEqual(MIN_PLAYERS)
    expect(count).toBeLessThanOrEqual(MAX_PLAYERS)
    expect(hasErrors(checkBoard(board.roles))).toBe(false)
  })

  it('has unique ids', () => {
    expect(new Set(BUILTIN_BOARDS.map((b) => b.id)).size).toBe(BUILTIN_BOARDS.length)
  })

  it('are all unverified until a person checks them', () => {
    expect(BUILTIN_BOARDS.filter((b) => !isUnverified(b))).toEqual([])
  })

  it('play small tables as 屠城 without a sheriff', () => {
    expect(builtinBoard('b8-seer-witch-hunter')?.rules).toMatchObject({
      win: 'city',
      sheriff: false,
    })
    expect(builtinBoard('b12-seer-witch-hunter-guard')?.rules).toEqual(DEFAULT_RULES)
    expect(builtinBoard('nope')).toBeUndefined()
  })
})

describe('normalizeRules', () => {
  it('fills in missing or unknown settings', () => {
    expect(normalizeRules(null)).toEqual(DEFAULT_RULES)
    expect(normalizeRules({ win: 'city', sheriff: false, lastWords: 'x' })).toEqual({
      ...DEFAULT_RULES,
      win: 'city',
      sheriff: false,
    })
  })
})
