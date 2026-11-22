import { describe, expect, it } from 'vite-plus/test'
import type { SeatRole } from './table.ts'
import { visionFor } from './vision.ts'

const table: SeatRole[] = [
  { seat: 1, role: 'werewolf' },
  { seat: 2, role: 'wolfKing' },
  { seat: 3, role: 'hiddenWolf' },
  { seat: 4, role: 'seer' },
  { seat: 5, role: 'werewolf' },
]

describe('visionFor', () => {
  it('lets wolves see the pack, 狼王 included, but not 隱狼', () => {
    expect(visionFor(table, 1, 'seats')).toEqual([{ seat: 2 }, { seat: 5 }])
    expect(visionFor(table, 5, 'seats')).toEqual([{ seat: 1 }, { seat: 2 }])
  })

  it('shows 狼王 to the other wolves with its role', () => {
    expect(visionFor(table, 1, 'roles')).toContainEqual({ seat: 2, role: 'wolfKing' })
  })

  it('lets 隱狼 see every wolf', () => {
    expect(visionFor(table, 3, 'roles')).toEqual([
      { seat: 1, role: 'werewolf' },
      { seat: 2, role: 'wolfKing' },
      { seat: 5, role: 'werewolf' },
    ])
  })

  it('gives other roles and mode none nothing', () => {
    expect(visionFor(table, 4, 'roles')).toEqual([])
    expect(visionFor(table, 1, 'none')).toEqual([])
    expect(visionFor(table, 9, 'seats')).toEqual([])
  })
})
