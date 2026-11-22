import {
  isRoleId,
  LOCALES,
  normalizeRules,
  ROLE_IDS,
  type BoardRules,
  type Localized,
  type RoleCounts,
  type SeatRole,
} from '@werewolf/rules'
import { decodePayload, encodePayload, ShareError } from '@werewolf/share'
import { z } from 'zod'

/** `/judge/?t=<payload>`: a finished deal handed to the moderator assistant. */
export const HANDOFF_PARAM = 't'
const VERSION = 1

export interface Handoff {
  boardId: string | null
  boardName: Localized | string
  roles: RoleCounts
  rules: BoardRules
  table: SeatRole[]
}

const localizedSchema = z.object(
  Object.fromEntries(LOCALES.map((l) => [l, z.string()])) as Record<
    (typeof LOCALES)[number],
    z.ZodString
  >,
)

const schema = z.tuple([
  z.literal(VERSION),
  z.string().nullable(),
  z.union([z.string(), localizedSchema]),
  z.unknown(),
  z
    .array(
      z
        .number()
        .int()
        .min(0)
        .max(ROLE_IDS.length - 1),
    )
    .min(1)
    .max(20),
])

/** `[version, board id, board name, rules, role index per seat]`. */
export async function encodeHandoff(h: Handoff): Promise<string> {
  const bySeat = h.table.toSorted((a, b) => a.seat - b.seat).map((s) => ROLE_IDS.indexOf(s.role))
  return encodePayload([VERSION, h.boardId, h.boardName, h.rules, bySeat])
}

export async function decodeHandoff(payload: string): Promise<Handoff> {
  const parsed = schema.safeParse(await decodePayload(payload))
  if (!parsed.success) throw new ShareError('not a deal')
  const [, boardId, boardName, rules, bySeat] = parsed.data
  const table = bySeat.map((i, seat) => ({ seat: seat + 1, role: ROLE_IDS[i]! }))
  const roles: RoleCounts = {}
  for (const { role } of table) if (isRoleId(role)) roles[role] = (roles[role] ?? 0) + 1
  return { boardId, boardName, roles, rules: normalizeRules(rules), table }
}
