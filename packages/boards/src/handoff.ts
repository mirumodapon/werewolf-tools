import {
  builtinBoard,
  countRoles,
  LOCALES,
  ROLE_IDS,
  type BoardRules,
  type Localized,
  type RoleCounts,
  type SeatRole,
} from '@werewolf/rules'
import { decodePayload, encodePayload, ShareError } from '@werewolf/share'
import { z } from 'zod'
import { packedRulesSchema, packRules } from './codec.ts'

/** `/judge/?t=<payload>`: a finished deal handed to the moderator assistant. */
export const HANDOFF_PARAM = 't'
/** 2: compact (built-in boards by id, seats as one base-36 string). */
const VERSION = 2

export interface Handoff {
  boardId: string | null
  boardName: Localized | string
  roles: RoleCounts
  rules: BoardRules
  table: SeatRole[]
}

const sameRules = (a: BoardRules, b: BoardRules) =>
  a.win === b.win &&
  a.guardSaveConflict === b.guardSaveConflict &&
  a.sheriff === b.sheriff &&
  a.lastWords === b.lastWords

/** Each seat's role index as one base-36 digit (fewer than 36 roles), seat 1 first. */
export const packSeats = (table: readonly SeatRole[]) =>
  table
    .toSorted((a, b) => a.seat - b.seat)
    .map((s) => ROLE_IDS.indexOf(s.role).toString(36))
    .join('')

export function unpackSeats(text: string): SeatRole[] {
  return [...text].map((c, i) => {
    const role = ROLE_IDS[Number.parseInt(c, 36)]
    if (!role) throw new ShareError('unknown role')
    return { seat: i + 1, role }
  })
}

const localizedSchema = z.object(
  Object.fromEntries(LOCALES.map((l) => [l, z.string()])) as Record<
    (typeof LOCALES)[number],
    z.ZodString
  >,
)

const schema = z.union([
  // A built-in board played with its own rules: just its id.
  z.tuple([z.literal(VERSION), z.string().min(1), z.string().regex(/^[0-9a-z]{1,20}$/)]),
  // Anything else: no id (or a custom one), its name and rules.
  z.tuple([
    z.literal(VERSION),
    z.string().nullable(),
    z.string().regex(/^[0-9a-z]{1,20}$/),
    z.union([z.string(), localizedSchema]),
    packedRulesSchema,
  ]),
])

/**
 * `[version, built-in id, seats]` for a built-in board with its rules, else
 * `[version, id, seats, name, rules]`. Cards are counted from the seats.
 */
export async function encodeHandoff(h: Handoff): Promise<string> {
  const builtin = builtinBoard(h.boardId)
  const seats = packSeats(h.table)
  return encodePayload(
    builtin && sameRules(builtin.rules, h.rules)
      ? [VERSION, builtin.id, seats]
      : [VERSION, h.boardId, seats, h.boardName, packRules(h.rules)],
  )
}

export async function decodeHandoff(payload: string): Promise<Handoff> {
  const parsed = schema.safeParse(await decodePayload(payload))
  if (!parsed.success) throw new ShareError('not a deal')
  const value = parsed.data
  const table = unpackSeats(value[2])
  if (value.length === 3) {
    const builtin = builtinBoard(value[1])
    if (!builtin) throw new ShareError('unknown board')
    return {
      boardId: builtin.id,
      boardName: builtin.name,
      roles: countRoles(table),
      rules: builtin.rules,
      table,
    }
  }
  return {
    boardId: value[1],
    boardName: value[3],
    roles: countRoles(table),
    rules: value[4],
    table,
  }
}
