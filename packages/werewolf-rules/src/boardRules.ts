/**
 * Rule settings of a board (板子設定). The moderator assistant follows them; the deal tool
 * only shows them.
 */

/** 屠邊: wolves win when every god or every villager is out. 屠城: when every good player is. */
export const WIN_CONDITIONS = ['side', 'city'] as const
export type WinCondition = (typeof WIN_CONDITIONS)[number]

/** Whether the witch may use the antidote on herself. */
export const WITCH_SELF_SAVE = ['never', 'firstNight', 'always'] as const
export type WitchSelfSave = (typeof WITCH_SELF_SAVE)[number]

/** 同守同救: guarded and saved on the same night. */
export const GUARD_SAVE_CONFLICT = ['dies', 'lives'] as const
export type GuardSaveConflict = (typeof GUARD_SAVE_CONFLICT)[number]

/** Who may speak after dying at night (the exiled always may). */
export const LAST_WORDS = ['firstNight', 'always', 'never'] as const
export type LastWords = (typeof LAST_WORDS)[number]

export interface BoardRules {
  win: WinCondition
  witchSelfSave: WitchSelfSave
  guardSaveConflict: GuardSaveConflict
  /** 警長競選 on the first day, before the deaths are announced. */
  sheriff: boolean
  lastWords: LastWords
}

export const DEFAULT_RULES: BoardRules = {
  win: 'side',
  witchSelfSave: 'firstNight',
  guardSaveConflict: 'dies',
  sheriff: true,
  lastWords: 'firstNight',
}

/** Small tables usually play 屠城 without a sheriff. */
export const SMALL_TABLE_RULES: BoardRules = { ...DEFAULT_RULES, win: 'city', sheriff: false }

const pick = <T extends string>(options: readonly T[], value: unknown, fallback: T): T =>
  options.includes(value as T) ? (value as T) : fallback

/** Any stored value as complete rules; unknown fields fall back to the defaults. */
export function normalizeRules(value: unknown): BoardRules {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Partial<BoardRules>
  return {
    win: pick(WIN_CONDITIONS, v.win, DEFAULT_RULES.win),
    witchSelfSave: pick(WITCH_SELF_SAVE, v.witchSelfSave, DEFAULT_RULES.witchSelfSave),
    guardSaveConflict: pick(
      GUARD_SAVE_CONFLICT,
      v.guardSaveConflict,
      DEFAULT_RULES.guardSaveConflict,
    ),
    sheriff: typeof v.sheriff === 'boolean' ? v.sheriff : DEFAULT_RULES.sheriff,
    lastWords: pick(LAST_WORDS, v.lastWords, DEFAULT_RULES.lastWords),
  }
}
