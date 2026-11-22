import { cleanCounts, isRoleId, normalizeRules, type Board, type RoleCounts } from '@werewolf/rules'
import { globalKey, type StoreSpec } from '@werewolf/storage'
import { z } from 'zod'

/** A board made on this phone. Never verified: its moderator logic is nobody's checked case. */
export interface CustomBoard extends Board {
  name: string
  note?: string
  builtin: false
  verified: false
}

const schema = z.object({
  id: z.string().min(1),
  name: z.string(),
  note: z.string().optional(),
  roles: z.record(z.string(), z.number().int().nonnegative()),
  rules: z.unknown().optional(),
})

export function parseCustomBoard(value: unknown): CustomBoard | null {
  const parsed = schema.safeParse(value)
  if (!parsed.success) return null
  const roles: RoleCounts = {}
  for (const [role, n] of Object.entries(parsed.data.roles)) if (isRoleId(role)) roles[role] = n
  const board: CustomBoard = {
    id: parsed.data.id,
    name: parsed.data.name,
    roles: cleanCounts(roles),
    rules: normalizeRules(parsed.data.rules),
    builtin: false,
    verified: false,
  }
  if (parsed.data.note) board.note = parsed.data.note
  return board
}

/**
 * Custom boards are shared by the tools that use boards (deal edits them, the moderator
 * assistant reads them), so they live in the global scope.
 */
export const BOARDS_STORE: StoreSpec<CustomBoard[]> = {
  key: globalKey('boards'),
  version: 1,
  parse: (data) =>
    Array.isArray(data)
      ? data.map(parseCustomBoard).filter((b): b is CustomBoard => b !== null)
      : [],
  fallback: () => [],
}
