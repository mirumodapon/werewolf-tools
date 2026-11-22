/**
 * Advanced settings chosen for one game before it starts (法官輔助的進階設定). Each
 * applies only to boards that have one of its roles; a board with none of them has no
 * advanced settings. Add an option here, give it text in the judge app's locales
 * (`options.items.<id>`), and make the engine read it from `setup.options`.
 */
import type { RoleId } from '../roles.ts'
import type { RoleCounts } from '../table.ts'

export const OPTION_IDS = ['witchToldAfterAntidote', 'guardSelf'] as const
export type OptionId = (typeof OPTION_IDS)[number]

export interface OptionDef {
  id: OptionId
  /** Shown when the board has any of these roles. */
  roles: readonly RoleId[]
  default: boolean
}

export const ADVANCED_OPTIONS: readonly OptionDef[] = [
  /** The witch is still told who was attacked after using her antidote. */
  { id: 'witchToldAfterAntidote', roles: ['witch'], default: false },
  /** The guard may protect himself. */
  { id: 'guardSelf', roles: ['guard'], default: true },
]

/** Chosen values; missing ones use the option's default. */
export type JudgeOptions = Partial<Record<OptionId, boolean>>

/** The options that apply to a board, in display order. */
export function optionsFor(roles: RoleCounts): OptionDef[] {
  return ADVANCED_OPTIONS.filter((o) => o.roles.some((r) => (roles[r] ?? 0) > 0))
}

/** Every option's value for this game. */
export function resolveOptions(values: JudgeOptions | undefined): Record<OptionId, boolean> {
  return Object.fromEntries(
    ADVANCED_OPTIONS.map((o) => [o.id, values?.[o.id] ?? o.default]),
  ) as Record<OptionId, boolean>
}

/** Stored values limited to known options and booleans. */
export function normalizeOptions(value: unknown): JudgeOptions {
  const out: JudgeOptions = {}
  if (typeof value !== 'object' || value === null) return out
  for (const id of OPTION_IDS) {
    const v = (value as Record<string, unknown>)[id]
    if (typeof v === 'boolean') out[id] = v
  }
  return out
}
