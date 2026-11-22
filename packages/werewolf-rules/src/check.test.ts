import { describe, expect, it } from 'vite-plus/test'
import { checkBoard, hasErrors } from './check.ts'

const codes = (counts: Parameters<typeof checkBoard>[0]) => checkBoard(counts).map((i) => i.code)

describe('checkBoard', () => {
  it('accepts a classic board', () => {
    expect(
      checkBoard({ werewolf: 4, seer: 1, witch: 1, hunter: 1, guard: 1, villager: 4 }),
    ).toEqual([])
  })

  it('rejects the wrong size, no wolves and repeated unique roles', () => {
    expect(codes({ werewolf: 2, villager: 3 })).toContain('playerCount')
    expect(codes({ seer: 1, villager: 9 })).toContain('noWolves')
    expect(checkBoard({ werewolf: 3, seer: 2, villager: 5 })).toContainEqual({
      level: 'error',
      code: 'uniqueRole',
      role: 'seer',
      count: 2,
    })
  })

  it('rejects bad counts and unknown roles', () => {
    expect(codes({ werewolf: -1 } as never)).toEqual(['badCount'])
    expect(codes({ thief: 1 } as never)).toEqual(['badCount'])
    expect(codes({ werewolf: 1.5 } as never)).toEqual(['badCount'])
  })

  it('warns about the wolf ratio, no gods and complex roles on small tables', () => {
    expect(codes({ werewolf: 1, seer: 1, villager: 8 })).toContain('fewWolves')
    expect(codes({ werewolf: 5, seer: 1, villager: 4 })).toContain('manyWolves')
    expect(codes({ werewolf: 3, villager: 7 })).toContain('noGods')
    const issues = checkBoard({ werewolf: 3, seer: 1, cupid: 1, villager: 4 })
    expect(issues.find((i) => i.code === 'complexRole')).toMatchObject({
      level: 'warning',
      role: 'cupid',
    })
    expect(hasErrors(issues)).toBe(false)
  })
})
