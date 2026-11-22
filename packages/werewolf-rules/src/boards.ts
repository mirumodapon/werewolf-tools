import { DEFAULT_RULES, SMALL_TABLE_RULES, type BoardRules } from './boardRules.ts'
import type { Localized } from './locale.ts'
import type { RoleCounts } from './table.ts'

export const MIN_PLAYERS = 8
export const MAX_PLAYERS = 20

/** A board (板子): which cards, and the rules played with them. Players = card total. */
export interface Board {
  /** Built-in: `b12-seer-witch-hunter-guard`; custom: a uuid. */
  id: string
  /** Built-in boards are named in every language; custom ones have the name typed in. */
  name: Localized | string
  roles: RoleCounts
  rules: BoardRules
  note?: Localized | string
  builtin: boolean
  /**
   * The moderator logic for this board has been checked by a person. Until then the
   * tools show 「未驗證」. Custom boards are never verified. To verify a built-in board,
   * set `verified: true` on it below in a release.
   */
  verified: boolean
}

interface BuiltinInput {
  players: number
  slug: string
  name: Localized
  roles: RoleCounts
  rules?: BoardRules
  note?: Localized
  verified?: boolean
}

const builtin = ({ players, slug, rules, verified, ...rest }: BuiltinInput): Board => ({
  id: `b${players}-${slug}`,
  rules: rules ?? DEFAULT_RULES,
  builtin: true,
  verified: verified ?? false,
  ...rest,
})

const SWH = { seer: 1, witch: 1, hunter: 1 } as const

/** Common boards by player count; 11, 13, 17 and 19 have none (make a custom one). */
export const BUILTIN_BOARDS: readonly Board[] = [
  builtin({
    players: 8,
    slug: 'seer-witch-hunter',
    name: { 'zh-TW': '預女獵', 'en-US': 'Seer · Witch · Hunter' },
    roles: { werewolf: 3, ...SWH, villager: 2 },
    rules: SMALL_TABLE_RULES,
  }),
  builtin({
    players: 9,
    slug: 'seer-witch-hunter',
    name: { 'zh-TW': '預女獵', 'en-US': 'Seer · Witch · Hunter' },
    roles: { werewolf: 3, ...SWH, villager: 3 },
    rules: SMALL_TABLE_RULES,
  }),
  builtin({
    players: 10,
    slug: 'seer-witch-hunter-idiot',
    name: { 'zh-TW': '預女獵白', 'en-US': 'Seer · Witch · Hunter · Idiot' },
    roles: { werewolf: 3, ...SWH, idiot: 1, villager: 3 },
  }),
  builtin({
    players: 12,
    slug: 'seer-witch-hunter-idiot',
    name: { 'zh-TW': '預女獵白', 'en-US': 'Seer · Witch · Hunter · Idiot' },
    roles: { werewolf: 4, ...SWH, idiot: 1, villager: 4 },
  }),
  builtin({
    players: 12,
    slug: 'seer-witch-hunter-guard',
    name: { 'zh-TW': '預女獵守', 'en-US': 'Seer · Witch · Hunter · Guard' },
    roles: { werewolf: 4, ...SWH, guard: 1, villager: 4 },
  }),
  builtin({
    players: 12,
    slug: 'wolf-king-guard',
    name: { 'zh-TW': '狼王守衛', 'en-US': 'Wolf King · Guard' },
    roles: { werewolf: 3, wolfKing: 1, ...SWH, guard: 1, villager: 4 },
  }),
  builtin({
    players: 12,
    slug: 'white-wolf-king-knight',
    name: { 'zh-TW': '白狼王騎士', 'en-US': 'White Wolf King · Knight' },
    roles: { werewolf: 3, whiteWolfKing: 1, seer: 1, witch: 1, knight: 1, guard: 1, villager: 4 },
  }),
  builtin({
    players: 12,
    slug: 'wolf-beauty-knight',
    name: { 'zh-TW': '狼美人騎士', 'en-US': 'Wolf Beauty · Knight' },
    roles: { werewolf: 3, wolfBeauty: 1, seer: 1, witch: 1, knight: 1, guard: 1, villager: 4 },
  }),
  builtin({
    players: 12,
    slug: 'hidden-wolf',
    name: { 'zh-TW': '隱狼', 'en-US': 'Hidden Wolf' },
    roles: { werewolf: 3, hiddenWolf: 1, ...SWH, idiot: 1, villager: 4 },
  }),
  builtin({
    players: 12,
    slug: 'wolf-king-magician',
    name: { 'zh-TW': '狼王魔術師', 'en-US': 'Wolf King · Magician' },
    roles: { werewolf: 3, wolfKing: 1, ...SWH, magician: 1, villager: 4 },
  }),
  builtin({
    players: 12,
    slug: 'wolf-king-gravekeeper',
    name: { 'zh-TW': '狼王守墓人', 'en-US': 'Wolf King · Gravekeeper' },
    roles: { werewolf: 3, wolfKing: 1, ...SWH, gravekeeper: 1, villager: 4 },
  }),
  builtin({
    players: 12,
    slug: 'wolf-king-crow',
    name: { 'zh-TW': '狼王烏鴉', 'en-US': 'Wolf King · Crow' },
    roles: { werewolf: 3, wolfKing: 1, ...SWH, crow: 1, villager: 4 },
  }),
  builtin({
    players: 14,
    slug: 'white-wolf-king',
    name: { 'zh-TW': '白狼王', 'en-US': 'White Wolf King' },
    roles: { werewolf: 4, whiteWolfKing: 1, ...SWH, guard: 1, idiot: 1, villager: 4 },
  }),
  builtin({
    players: 15,
    slug: 'wolf-king',
    name: { 'zh-TW': '狼王', 'en-US': 'Wolf King' },
    roles: { werewolf: 4, wolfKing: 1, ...SWH, guard: 1, idiot: 1, villager: 5 },
  }),
  builtin({
    players: 16,
    slug: 'two-kings-knight',
    name: { 'zh-TW': '雙狼王騎士', 'en-US': 'Two Wolf Kings · Knight' },
    roles: {
      werewolf: 3,
      wolfKing: 1,
      whiteWolfKing: 1,
      ...SWH,
      guard: 1,
      idiot: 1,
      knight: 1,
      villager: 5,
    },
  }),
  builtin({
    players: 18,
    slug: 'cupid',
    name: { 'zh-TW': '丘比特', 'en-US': 'Cupid' },
    roles: {
      werewolf: 4,
      wolfKing: 1,
      wolfBeauty: 1,
      ...SWH,
      guard: 1,
      idiot: 1,
      knight: 1,
      cupid: 1,
      villager: 5,
    },
  }),
  builtin({
    players: 20,
    slug: 'melee',
    name: { 'zh-TW': '混戰', 'en-US': 'Melee' },
    roles: {
      werewolf: 4,
      wolfKing: 1,
      whiteWolfKing: 1,
      hiddenWolf: 1,
      ...SWH,
      guard: 1,
      idiot: 1,
      knight: 1,
      magician: 1,
      gravekeeper: 1,
      mixedBlood: 1,
      wildChild: 1,
      villager: 3,
    },
  }),
]

export function builtinBoard(id: string | null | undefined): Board | undefined {
  return id ? BUILTIN_BOARDS.find((b) => b.id === id) : undefined
}

/** Whether the tools must label the board 「未驗證」. */
export const isUnverified = (board: Pick<Board, 'verified'>) => !board.verified
