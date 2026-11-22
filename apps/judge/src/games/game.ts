import {
  BUILTIN_BOARDS,
  deriveGame,
  isRoleId,
  LOCALES,
  normalizeRules,
  ROLE_IDS,
  type Board,
  type BoardRules,
  type DerivedGame,
  type GameEvent,
  type JudgeSetup,
  type Localized,
  type RoleCounts,
  type SeatRole,
  type Winner,
} from '@werewolf/rules'
import { z } from 'zod'

export const SCHEMA_VERSION = 1

/** The board a game was played with, copied in (later edits to the board do not change it). */
export interface GameBoard {
  id: string | null
  name: Localized | string
  roles: RoleCounts
  rules: BoardRules
  verified: boolean
}

/** One game: the setup and the moderator's inputs. Everything else is derived. */
export interface JudgeGame {
  schemaVersion: typeof SCHEMA_VERSION
  id: string
  createdAt: number
  updatedAt: number
  /** Typed by the moderator; empty means the automatic name. */
  name: string
  /** Which game of its day it was (for the automatic name). */
  seq: number
  note: string
  board: GameBoard
  /** Cards known from the start (handed over from the deal tool). */
  table: SeatRole[]
  events: GameEvent[]
}

export const setupOf = (game: JudgeGame): JudgeSetup => ({
  roles: game.board.roles,
  rules: game.board.rules,
  table: game.table,
})

export const derive = (game: JudgeGame): DerivedGame => deriveGame(setupOf(game), game.events)

export function winnerOf(game: JudgeGame): Winner | null {
  return derive(game).state.winner
}

export function boardOf(board: Board): GameBoard {
  return {
    id: board.id,
    name: board.name,
    roles: { ...board.roles },
    rules: { ...board.rules },
    verified: board.verified,
  }
}

/** Whether the game's board still counts as verified (the flag may change in a release). */
export function isVerified(board: GameBoard): boolean {
  const builtin = BUILTIN_BOARDS.find((b) => b.id === board.id)
  return builtin ? builtin.verified : false
}

const dayKey = (ms: number) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** One more than the highest number used on the same day. */
export function nextSeq(
  games: readonly Pick<JudgeGame, 'createdAt' | 'seq'>[],
  now: number,
): number {
  const today = dayKey(now)
  return Math.max(0, ...games.filter((g) => dayKey(g.createdAt) === today).map((g) => g.seq)) + 1
}

/** `2026-11-22 第3場` (the date and number are filled in by the caller's language). */
export const autoNameParts = (game: Pick<JudgeGame, 'createdAt' | 'seq'>) => ({
  date: dayKey(game.createdAt),
  seq: game.seq,
})

const localizedSchema = z.object(
  Object.fromEntries(LOCALES.map((l) => [l, z.string()])) as Record<
    (typeof LOCALES)[number],
    z.ZodString
  >,
)
const seat = z.number().int().positive()

/** Inputs are checked by replaying them (deriveGame); here only their shape. */
const eventSchema = z.looseObject({ step: z.string() })

export const gameSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: z.string().min(1),
  createdAt: z.number(),
  updatedAt: z.number(),
  name: z.string().catch(''),
  seq: z.number().int().nonnegative().catch(1),
  note: z.string().catch(''),
  board: z.object({
    id: z.string().nullable(),
    name: z.union([z.string(), localizedSchema]),
    roles: z.partialRecord(z.enum(ROLE_IDS), z.number().int().nonnegative()),
    rules: z.unknown().optional(),
    verified: z.boolean().catch(false),
  }),
  table: z.array(z.object({ seat, role: z.string().refine(isRoleId) })),
  events: z.array(eventSchema),
})

/** A stored or imported game, or null when it is not one. */
export function parseGame(value: unknown): JudgeGame | null {
  const parsed = gameSchema.safeParse(value)
  if (!parsed.success) return null
  return {
    ...parsed.data,
    board: { ...parsed.data.board, rules: normalizeRules(parsed.data.board.rules) },
  } as JudgeGame
}
