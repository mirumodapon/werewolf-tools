/**
 * Advanced settings chosen for one game before it starts (法官輔助的進階設定). Each
 * applies only to boards that have one of its roles; a board with none of them has no
 * advanced settings. To add one: define it here, give it text in the judge app's
 * locales (`options.items.<id>`), and read it in the engine with `resolveOptions`.
 */
import type { RoleId } from '../roles.ts'
import type { RoleCounts } from '../table.ts'

/** Whether the witch may use the antidote on herself: 都不行／都可以／第一晚可以／第一晚不行. */
export const WITCH_SELF_SAVE = ['never', 'always', 'firstNight', 'notFirstNight'] as const
export type WitchSelfSave = (typeof WITCH_SELF_SAVE)[number]

/** The value of every option, as the engine reads it. */
export interface ResolvedOptions {
  witchSelfSave: WitchSelfSave
  witchToldAfterAntidote: boolean
  guardSelf: boolean
  wolfKingMeetsPack: boolean
  wolfKingShootAfterExplode: boolean
}

export type OptionId = keyof ResolvedOptions

interface OptionBase {
  id: OptionId
  /** Shown when the board has any of these roles. */
  roles: readonly RoleId[]
}

export type OptionDef =
  | (OptionBase & { kind: 'boolean'; default: boolean })
  | (OptionBase & { kind: 'choice'; choices: readonly string[]; default: string })

/** In display order. */
export const ADVANCED_OPTIONS: readonly OptionDef[] = [
  {
    id: 'witchSelfSave',
    roles: ['witch'],
    kind: 'choice',
    choices: WITCH_SELF_SAVE,
    default: 'never',
  },
  /** The witch is still told who was attacked after using her antidote. */
  { id: 'witchToldAfterAntidote', roles: ['witch'], kind: 'boolean', default: false },
  /** The guard may protect himself. */
  { id: 'guardSelf', roles: ['guard'], kind: 'boolean', default: true },
  /**
   * 狼王 wakes with the pack and they know each other. When off he stays apart (no kill,
   * unknown to the pack) until the rest of the pack is out, then joins the kill.
   */
  { id: 'wolfKingMeetsPack', roles: ['wolfKing'], kind: 'boolean', default: true },
  /** 狼王 may still shoot after exploding (自爆). */
  { id: 'wolfKingShootAfterExplode', roles: ['wolfKing'], kind: 'boolean', default: false },
]

export const OPTION_IDS = ADVANCED_OPTIONS.map((o) => o.id)

/** Chosen values; missing ones use the option's default. */
export type JudgeOptions = Partial<Record<OptionId, boolean | string>>

/** The options that apply to a board, in display order. */
export function optionsFor(roles: RoleCounts): OptionDef[] {
  return ADVANCED_OPTIONS.filter((o) => o.roles.some((r) => (roles[r] ?? 0) > 0))
}

function valid(def: OptionDef, value: unknown): boolean {
  return def.kind === 'boolean' ? typeof value === 'boolean' : def.choices.includes(value as string)
}

/** Every option's value for this game. */
export function resolveOptions(values: JudgeOptions | undefined): ResolvedOptions {
  return Object.fromEntries(
    ADVANCED_OPTIONS.map((o) => [o.id, valid(o, values?.[o.id]) ? values![o.id] : o.default]),
  ) as unknown as ResolvedOptions
}

/** Stored values limited to known options and allowed values. */
export function normalizeOptions(value: unknown): JudgeOptions {
  const out: JudgeOptions = {}
  if (typeof value !== 'object' || value === null) return out
  for (const def of ADVANCED_OPTIONS) {
    const v = (value as Record<string, unknown>)[def.id]
    if (valid(def, v)) out[def.id] = v as boolean | string
  }
  return out
}

/** Whether the witch may save herself on this night. */
export function witchMaySaveSelf(rule: WitchSelfSave, round: number): boolean {
  return (
    rule === 'always' ||
    (rule === 'firstNight' && round === 1) ||
    (rule === 'notFirstNight' && round > 1)
  )
}
