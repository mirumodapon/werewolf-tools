import { MAX_PLAYERS, MIN_PLAYERS } from './boards.ts'
import { ROLE_IDS, ROLES, isRoleId, type RoleId } from './roles.ts'
import { playerCount, type RoleCounts } from './table.ts'

export const MIN_WOLF_RATIO = 0.2
export const MAX_WOLF_RATIO = 0.4
export const MIN_PLAYERS_FOR_COMPLEX = 10

/** A board problem, as a code; the text comes from i18n (`check.<code>`). */
export type BoardIssue =
  | { level: 'error'; code: 'playerCount'; count: number; min: number; max: number }
  | { level: 'error'; code: 'noWolves' }
  | { level: 'error'; code: 'uniqueRole'; role: RoleId; count: number }
  | { level: 'error'; code: 'badCount'; role: string }
  | { level: 'warning'; code: 'fewWolves' | 'manyWolves'; wolves: number; count: number }
  | { level: 'warning'; code: 'noGods' }
  | { level: 'warning'; code: 'complexRole'; role: RoleId; min: number }

/** Errors block dealing and moderating; warnings are only shown. */
export function checkBoard(counts: RoleCounts): BoardIssue[] {
  const bad = Object.entries(counts)
    .filter(([role, n]) => !isRoleId(role) || !Number.isInteger(n) || (n as number) < 0)
    .map(([role]): BoardIssue => ({ level: 'error', code: 'badCount', role }))
  if (bad.length) return bad

  const issues: BoardIssue[] = []
  const n = (id: RoleId) => counts[id] ?? 0
  const count = playerCount(counts)
  const sum = (faction: string) =>
    ROLE_IDS.filter((id) => ROLES[id].faction === faction).reduce((s, id) => s + n(id), 0)
  const wolves = sum('wolf')

  if (count < MIN_PLAYERS || count > MAX_PLAYERS)
    issues.push({ level: 'error', code: 'playerCount', count, min: MIN_PLAYERS, max: MAX_PLAYERS })
  if (wolves === 0) issues.push({ level: 'error', code: 'noWolves' })
  for (const id of ROLE_IDS)
    if (ROLES[id].unique && n(id) > 1)
      issues.push({ level: 'error', code: 'uniqueRole', role: id, count: n(id) })

  if (count > 0 && wolves > 0) {
    if (wolves / count < MIN_WOLF_RATIO)
      issues.push({ level: 'warning', code: 'fewWolves', wolves, count })
    if (wolves / count > MAX_WOLF_RATIO)
      issues.push({ level: 'warning', code: 'manyWolves', wolves, count })
  }
  if (sum('god') === 0) issues.push({ level: 'warning', code: 'noGods' })
  if (count < MIN_PLAYERS_FOR_COMPLEX)
    for (const id of ROLE_IDS)
      if (ROLES[id].complex && n(id) > 0)
        issues.push({
          level: 'warning',
          code: 'complexRole',
          role: id,
          min: MIN_PLAYERS_FOR_COMPLEX,
        })
  return issues
}

export const hasErrors = (issues: readonly BoardIssue[]) => issues.some((i) => i.level === 'error')
