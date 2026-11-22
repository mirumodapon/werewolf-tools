import { describe, expect, it } from 'vite-plus/test'
import { countRoles, expandRoles, playerCount } from './table.ts'
import { FACTIONS, isRoleId, ROLE_IDS, ROLES, rolesOf } from './roles.ts'

describe('roles', () => {
  it('defines every role once, with a faction', () => {
    expect(new Set(ROLE_IDS).size).toBe(ROLE_IDS.length)
    for (const id of ROLE_IDS) expect(FACTIONS).toContain(ROLES[id].faction)
  })

  it('only villagers and werewolves repeat', () => {
    expect(ROLE_IDS.filter((id) => !ROLES[id].unique)).toEqual(['werewolf', 'villager'])
  })

  it('groups by faction', () => {
    expect(rolesOf('wolf')).toEqual([
      'werewolf',
      'wolfKing',
      'whiteWolfKing',
      'wolfBeauty',
      'hiddenWolf',
    ])
    expect(isRoleId('seer')).toBe(true)
    expect(isRoleId('thief')).toBe(false)
  })

  it('counts and expands cards', () => {
    const counts = { werewolf: 2, seer: 1 }
    expect(playerCount(counts)).toBe(3)
    expect(expandRoles(counts)).toEqual(['werewolf', 'werewolf', 'seer'])
    expect(
      countRoles([
        { seat: 1, role: 'seer' },
        { seat: 2, role: 'werewolf' },
      ]),
    ).toEqual({
      werewolf: 1,
      seer: 1,
    })
  })
})
