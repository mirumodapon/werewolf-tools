import { ROLES, type RoleId } from './roles.ts'
import type { SeatRole } from './table.ts'

/**
 * What a wolf's card shows about the pack: `none` nothing, `seats` seat numbers
 * (default), `roles` seats and roles. 狼王 and the other special wolves are known to the
 * pack like any wolf; only 隱狼 stays hidden from it.
 */
export const VISION_MODES = ['none', 'seats', 'roles'] as const
export type VisionMode = (typeof VISION_MODES)[number]
export const DEFAULT_VISION_MODE: VisionMode = 'seats'

export interface SeenSeat {
  seat: number
  role?: RoleId
}

const isWolf = (role: RoleId) => ROLES[role].faction === 'wolf'

/** 隱狼 knows the pack; the pack does not know 隱狼. */
function knows(viewer: RoleId, target: RoleId): boolean {
  if (!isWolf(viewer) || !isWolf(target)) return false
  return viewer === 'hiddenWolf' || target !== 'hiddenWolf'
}

export function visionFor(table: readonly SeatRole[], seat: number, mode: VisionMode): SeenSeat[] {
  const self = table.find((s) => s.seat === seat)
  if (mode === 'none' || !self) return []
  return table
    .filter((s) => s.seat !== seat && knows(self.role, s.role))
    .toSorted((a, b) => a.seat - b.seat)
    .map((s) => (mode === 'roles' ? { seat: s.seat, role: s.role } : { seat: s.seat }))
}

/** Whether the card has a "your pack" section (it may be empty). */
export const hasVision = (role: RoleId) => isWolf(role)
