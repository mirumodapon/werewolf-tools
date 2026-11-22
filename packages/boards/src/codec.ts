import {
  cleanCounts,
  GUARD_SAVE_CONFLICT,
  LAST_WORDS,
  ROLE_IDS,
  WIN_CONDITIONS,
  type BoardRules,
  type RoleCounts,
} from '@werewolf/rules'
import { decodePayload, encodePayload, ShareError } from '@werewolf/share'
import { z } from 'zod'

/** `/deal/?b=<payload>` (the moderator assistant accepts it too). */
export const BOARD_PARAM = 'b'
export const MAX_NAME_LENGTH = 40
/** 2: the witch's self-save moved to the moderator's per-game options. */
const VERSION = 2

/** What a board link carries: name, cards and rules (no note, no id). */
export interface SharedBoard {
  name: string
  roles: RoleCounts
  rules: BoardRules
}

// Compact pieces shared by every link that carries a board (board, hand-off, game).

/** Rules as `[win, guard & save, sheriff, last words]` indexes. */
export const packRules = (r: BoardRules): number[] => [
  WIN_CONDITIONS.indexOf(r.win),
  GUARD_SAVE_CONFLICT.indexOf(r.guardSaveConflict),
  r.sheriff ? 1 : 0,
  LAST_WORDS.indexOf(r.lastWords),
]

const index = (max: number) => z.number().int().min(0).max(max)
export const packedRulesSchema = z
  .tuple([
    index(WIN_CONDITIONS.length - 1),
    index(GUARD_SAVE_CONFLICT.length - 1),
    index(1),
    index(LAST_WORDS.length - 1),
  ])
  .transform(([win, conflict, sheriff, lastWords]): BoardRules => ({
    win: WIN_CONDITIONS[win]!,
    guardSaveConflict: GUARD_SAVE_CONFLICT[conflict]!,
    sheriff: sheriff === 1,
    lastWords: LAST_WORDS[lastWords]!,
  }))

/** Card counts in ROLE_IDS order, trailing zeros dropped. */
export function packCounts(roles: RoleCounts): number[] {
  const counts = ROLE_IDS.map((id) => roles[id] ?? 0)
  while (counts.at(-1) === 0) counts.pop()
  return counts
}

export const packedCountsSchema = z
  .array(z.number().int().min(0).max(20))
  .max(ROLE_IDS.length)
  .transform((counts) => {
    const roles: RoleCounts = {}
    counts.forEach((n, i) => (roles[ROLE_IDS[i]!] = n))
    return cleanCounts(roles)
  })

const payloadSchema = z.tuple([
  z.literal(VERSION),
  z.string().trim().min(1).max(MAX_NAME_LENGTH),
  packedCountsSchema,
  packedRulesSchema,
])

/** `[version, name, counts, rules]`. */
export async function encodeBoard(board: SharedBoard): Promise<string> {
  return encodePayload([
    VERSION,
    board.name.slice(0, MAX_NAME_LENGTH),
    packCounts(board.roles),
    packRules(board.rules),
  ])
}

export async function decodeBoard(payload: string): Promise<SharedBoard> {
  const parsed = payloadSchema.safeParse(await decodePayload(payload))
  if (!parsed.success) throw new ShareError('not a board')
  const [, name, roles, rules] = parsed.data
  return { name: name.trim(), roles, rules }
}
