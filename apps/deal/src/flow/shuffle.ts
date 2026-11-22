import type { RoleId, SeatRole } from '@werewolf/rules'
import { secureRandomInt } from '@werewolf/storage'

/** Fisher–Yates into a new array. */
export function shuffle<T>(
  items: readonly T[],
  randomInt: (max: number) => number = secureRandomInt,
): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

/** The cards shuffled onto seats 1..n. */
export function dealRoles(
  roles: readonly RoleId[],
  randomInt?: (max: number) => number,
): SeatRole[] {
  return shuffle(roles, randomInt).map((role, i) => ({ seat: i + 1, role }))
}
