import { describe, expect, it } from 'vite-plus/test'
import { flowReducer, IDLE, isDealing, type Flow } from './deal.ts'
import { dealRoles, shuffle } from './shuffle.ts'
import { drawSpeaker } from './speaker.ts'

const table = [
  { seat: 1, role: 'seer' as const },
  { seat: 2, role: 'werewolf' as const },
]

describe('flowReducer', () => {
  it('walks every player through reveal and cover', () => {
    let flow: Flow = flowReducer(IDLE, { type: 'start', mode: 'deal', recordId: 'r', table })
    expect(flow).toMatchObject({ step: 'handoff', index: 0 })
    flow = flowReducer(flow, { type: 'reveal' })
    flow = flowReducer(flow, { type: 'hide' })
    expect(flow).toMatchObject({ step: 'handoff', index: 0 })
    for (let i = 0; i < 2; i++)
      flow = flowReducer(flowReducer(flow, { type: 'reveal' }), { type: 'confirm' })
    expect(flow).toEqual({ step: 'done', mode: 'deal', recordId: 'r' })
    expect(isDealing(flow)).toBe(false)
  })

  it('ignores actions that do not fit the step', () => {
    expect(flowReducer(IDLE, { type: 'confirm' })).toBe(IDLE)
  })
})

describe('dealing', () => {
  it('shuffles with the given numbers and seats from 1', () => {
    expect(shuffle([1, 2, 3], () => 0)).toEqual([2, 3, 1])
    expect(dealRoles(['seer', 'werewolf'], () => 0)).toEqual([
      { seat: 1, role: 'werewolf' },
      { seat: 2, role: 'seer' },
    ])
  })

  it('draws a speaker with or without a direction', () => {
    expect(drawSpeaker(12, false, () => 7)).toEqual({ seat: 8 })
    expect(drawSpeaker(12, true, (max) => (max === 2 ? 1 : 0))).toEqual({
      seat: 1,
      direction: 'ccw',
    })
    expect(() => drawSpeaker(0, false)).toThrow(RangeError)
  })
})
