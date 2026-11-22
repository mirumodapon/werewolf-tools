import { ROLE_IDS, type RoleId } from './roles.ts'

/** A seat (numbered from 1, clockwise) and its card. */
export interface SeatRole {
  seat: number
  role: RoleId
}

/** How many of each card, e.g. `{ werewolf: 3, seer: 1 }`. */
export type RoleCounts = Partial<Record<RoleId, number>>

export function playerCount(counts: RoleCounts): number {
  return Object.values(counts).reduce<number>((sum, n) => sum + (n ?? 0), 0)
}

/** One entry per card, in ROLE_IDS order. */
export function expandRoles(counts: RoleCounts): RoleId[] {
  return ROLE_IDS.flatMap((id) => Array.from({ length: counts[id] ?? 0 }, () => id))
}

/** Without zero entries and in ROLE_IDS order, so storage and links are stable. */
export function cleanCounts(counts: RoleCounts): RoleCounts {
  const out: RoleCounts = {}
  for (const id of ROLE_IDS) if (counts[id]) out[id] = counts[id]
  return out
}

/** The cards of a table, counted. */
export function countRoles(table: readonly SeatRole[]): RoleCounts {
  const counts: RoleCounts = {}
  for (const { role } of table) counts[role] = (counts[role] ?? 0) + 1
  return cleanCounts(counts)
}
