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
import { z } from 'zod'

/**
 * One deal, saved the moment it is dealt. Only ids are stored (no text), so records read
 * the same in any language.
 */
export interface DealRecord {
  id: string
  createdAt: number
  boardId: string | null
  boardName: Localized | string
  roles: RoleCounts
  rules: BoardRules
  assignments: SeatRole[]
}

/** Only the newest 10 deals are kept. */
export const MAX_RECORDS = 10

const localizedName = z.object(
  Object.fromEntries(LOCALES.map((l) => [l, z.string()])) as Record<
    (typeof LOCALES)[number],
    z.ZodString
  >,
)

const schema = z.object({
  id: z.string().min(1),
  createdAt: z.number(),
  boardId: z.string().nullable().catch(null),
  boardName: z.union([z.string(), localizedName]),
  roles: z.partialRecord(z.enum(ROLE_IDS), z.number().int().nonnegative()),
  rules: z.unknown().optional(),
  assignments: z
    .array(z.object({ seat: z.number().int().positive(), role: z.string().refine(isRoleId) }))
    .min(1),
})

export function normalizeRecord(value: unknown): DealRecord | null {
  const parsed = schema.safeParse(value)
  return parsed.success
    ? ({ ...parsed.data, rules: normalizeRules(parsed.data.rules) } as DealRecord)
    : null
}

export const readRecords = (rows: readonly unknown[]) =>
  rows.map(normalizeRecord).filter((r): r is DealRecord => r !== null)

interface Stamped {
  id: string
  createdAt: number
}

export const newestFirst = <T extends Stamped>(records: readonly T[]) =>
  records.toSorted((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id))

/** Ids beyond the newest `limit`: the ones to delete. */
export function recordsToPrune(records: readonly Stamped[], limit = MAX_RECORDS): string[] {
  return newestFirst(records)
    .slice(Math.max(0, limit))
    .map((r) => r.id)
}
