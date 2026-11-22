/**
 * The compact game link (`/judge/?s=`). JSON export keeps every field readable; a link
 * only needs what an import cannot work out again, as numbers:
 *
 *   [version, board, seq, created (minutes), name, note, seats, options, inputs]
 *
 * - board: a built-in id when the game used that board as it is, else
 *   `[name, counts, rules]` (see @werewolf/boards).
 * - seats: each seat's role as one base-36 digit ('' when the cards were not known).
 * - options: one number per advanced option, in ADVANCED_OPTIONS order (-1 unset).
 * - inputs: one flat array of numbers. Each input starts with its step number and has a
 *   fixed length per step, so no separators are needed; 0 stands for "nobody / none".
 *
 * Ids and timestamps other than the start are not sent: an import gets a new id.
 */
import {
  packCounts,
  packedCountsSchema,
  packedRulesSchema,
  packRules,
  packSeats,
  unpackSeats,
} from '@werewolf/boards'
import {
  ADVANCED_OPTIONS,
  builtinBoard,
  isRoleId,
  LOCALES,
  ROLE_IDS,
  type GameEvent,
  type JudgeOptions,
  type RoleId,
  type Winner,
} from '@werewolf/rules'
import { decodePayload, encodePayload, ShareError } from '@werewolf/share'
import { newId } from '@werewolf/storage'
import { z } from 'zod'
import { SCHEMA_VERSION, type GameBoard, type JudgeGame } from './game.ts'

const VERSION = 3

/** Step numbers. Append only: links made earlier keep their meaning. */
const STEPS = [
  'dusk',
  'cupid',
  'lovers',
  'mixedBlood',
  'wildChild',
  'magician',
  'guard',
  'wolves',
  'identify',
  'wolfBeauty',
  'hiddenWolf',
  'witch',
  'seer',
  'gravekeeper',
  'crow',
  'hunter',
  'sheriff',
  'deaths',
  'shoot',
  'badge',
  'day',
  'assign',
  'end',
] as const satisfies readonly GameEvent['step'][]
const WINNERS = ['good', 'wolf', 'third', 'none'] as const satisfies readonly Winner[]
const DAY_ACTIONS = ['vote', 'explode', 'duel'] as const

/** Seat or nobody → number (0 = nobody / not given). */
const n = (seat: number | null | undefined) => seat ?? 0
/** Number → seat, or null for 0. */
const seatOr = (v: number) => (v === 0 ? null : v)
const roleIndex = (role: RoleId) => ROLE_IDS.indexOf(role)

function packEvent(e: GameEvent): number[] {
  const s = STEPS.indexOf(e.step)
  switch (e.step) {
    case 'dusk':
    case 'lovers':
    case 'deaths':
      return [s]
    case 'cupid':
      return [s, n(e.actor), n(e.lovers?.[0]), n(e.lovers?.[1])]
    case 'mixedBlood':
    case 'wildChild':
      return [s, n(e.actor), n(e.target)]
    case 'magician':
      return [s, n(e.actor), n(e.swap?.[0]), n(e.swap?.[1])]
    case 'guard':
    case 'wolfBeauty':
    case 'seer':
    case 'crow':
      return [s, n(e.actor), n(e.target)]
    case 'wolves': {
      const actors = e.actors ?? []
      const specials = Object.entries(e.specials ?? {}).filter(([, seat]) => seat !== undefined)
      return [
        s,
        n(e.kill),
        actors.length,
        ...actors,
        specials.length,
        ...specials.flatMap(([role, seat]) => [roleIndex(role as RoleId), seat!]),
      ]
    }
    case 'identify':
      return [s, roleIndex(e.role), e.actor]
    case 'hiddenWolf':
    case 'gravekeeper':
    case 'hunter':
      return [s, n(e.actor)]
    case 'witch':
      return [s, n(e.actor), e.save ? 1 : 0, n(e.poison)]
    case 'sheriff':
      return [s, n(e.seat)]
    case 'shoot':
      return [s, n(e.target)]
    case 'badge':
      return [s, n(e.to)]
    case 'day':
      return e.action === 'vote'
        ? [s, 0, n(e.exiled), 0]
        : [s, DAY_ACTIONS.indexOf(e.action), e.actor, n(e.target)]
    case 'assign':
      return [s, e.seat, roleIndex(e.role)]
    case 'end':
      return [s, WINNERS.indexOf(e.winner)]
  }
}

/** Reads inputs back from the flat array; throws ShareError on anything malformed. */
function unpackEvents(flat: readonly number[]): GameEvent[] {
  let i = 0
  const take = () => {
    if (i >= flat.length) throw new ShareError('truncated inputs')
    return flat[i++]!
  }
  const actor = () => {
    const v = take()
    return v === 0 ? {} : { actor: v }
  }
  const role = () => {
    const r = ROLE_IDS[take()]
    if (!r) throw new ShareError('unknown role')
    return r
  }
  const events: GameEvent[] = []
  while (i < flat.length) {
    const step = STEPS[take()]
    if (!step) throw new ShareError('unknown step')
    switch (step) {
      case 'dusk':
      case 'lovers':
      case 'deaths':
        events.push({ step })
        break
      case 'cupid': {
        const who = actor()
        const a = take()
        const b = take()
        events.push(a && b ? { step, ...who, lovers: [a, b] } : { step, ...who })
        break
      }
      case 'mixedBlood':
      case 'wildChild': {
        const who = actor()
        const target = take()
        events.push(target ? { step, ...who, target } : { step, ...who })
        break
      }
      case 'magician': {
        const who = actor()
        const a = take()
        const b = take()
        events.push({ step, ...who, swap: a && b ? [a, b] : null })
        break
      }
      case 'guard':
      case 'wolfBeauty':
      case 'seer':
      case 'crow':
        events.push({ step, ...actor(), target: seatOr(take()) })
        break
      case 'wolves': {
        const kill = seatOr(take())
        const actors = Array.from({ length: take() }, take)
        const specials = Object.fromEntries(Array.from({ length: take() }, () => [role(), take()]))
        events.push({
          step,
          ...(actors.length ? { actors } : {}),
          ...(Object.keys(specials).length ? { specials } : {}),
          kill,
        })
        break
      }
      case 'identify': {
        const r = role()
        events.push({ step, role: r, actor: take() })
        break
      }
      case 'hiddenWolf':
      case 'gravekeeper':
      case 'hunter':
        events.push({ step, ...actor() })
        break
      case 'witch':
        events.push({ step, ...actor(), save: take() === 1, poison: seatOr(take()) })
        break
      case 'sheriff':
        events.push({ step, seat: seatOr(take()) })
        break
      case 'shoot':
        events.push({ step, target: seatOr(take()) })
        break
      case 'badge':
        events.push({ step, to: seatOr(take()) })
        break
      case 'day': {
        const action = DAY_ACTIONS[take()]
        const a = take()
        const b = take()
        if (action === 'vote') events.push({ step, action, exiled: seatOr(a) })
        else if (action === 'explode') events.push({ step, action, actor: a, target: seatOr(b) })
        else if (action === 'duel') events.push({ step, action, actor: a, target: b })
        else throw new ShareError('unknown day action')
        break
      }
      case 'assign': {
        const seat = take()
        events.push({ step, seat, role: role() })
        break
      }
      case 'end': {
        const winner = WINNERS[take()]
        if (!winner) throw new ShareError('unknown winner')
        events.push({ step, winner })
        break
      }
    }
  }
  return events
}

function packOptions(options: JudgeOptions): number[] {
  const out = ADVANCED_OPTIONS.map((o) => {
    const v = options[o.id]
    if (v === undefined) return -1
    return o.kind === 'boolean' ? (v ? 1 : 0) : o.choices.indexOf(v as string)
  })
  while (out.at(-1) === -1) out.pop()
  return out
}

function unpackOptions(values: readonly number[]): JudgeOptions {
  const out: JudgeOptions = {}
  ADVANCED_OPTIONS.forEach((o, i) => {
    const v = values[i]
    if (v === undefined || v < 0) return
    if (o.kind === 'boolean') out[o.id] = v === 1
    else if (o.choices[v] !== undefined) out[o.id] = o.choices[v]!
  })
  return out
}

/** A built-in board played exactly as built in: sent as its id. */
function packBoard(board: GameBoard): string | unknown[] {
  const builtin = builtinBoard(board.id)
  const same =
    builtin &&
    JSON.stringify(packCounts(builtin.roles)) === JSON.stringify(packCounts(board.roles)) &&
    JSON.stringify(packRules(builtin.rules)) === JSON.stringify(packRules(board.rules))
  return same ? builtin.id : [board.name, packCounts(board.roles), packRules(board.rules)]
}

const localizedSchema = z.object(
  Object.fromEntries(LOCALES.map((l) => [l, z.string()])) as Record<
    (typeof LOCALES)[number],
    z.ZodString
  >,
)

const schema = z.tuple([
  z.literal(VERSION),
  z.union([
    z.string().min(1),
    z.tuple([z.union([z.string(), localizedSchema]), packedCountsSchema, packedRulesSchema]),
  ]),
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
  z.string().max(40),
  z.string().max(2000),
  z.string().regex(/^[0-9a-z]{0,20}$/),
  z.array(z.number().int()),
  z.array(z.number().int().nonnegative()),
])

export function packGame(game: JudgeGame): unknown[] {
  return [
    VERSION,
    packBoard(game.board),
    game.seq,
    Math.round(game.createdAt / 60000),
    game.name,
    game.note,
    packSeats(game.table),
    packOptions(game.options),
    game.events.flatMap(packEvent),
  ]
}

/** The game in a link payload, with a fresh id. */
export function unpackGame(value: unknown): JudgeGame {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ShareError('not a game')
  const [, boardRef, seq, minutes, name, note, seats, options, inputs] = parsed.data
  let board: GameBoard
  if (typeof boardRef === 'string') {
    const builtin = builtinBoard(boardRef)
    if (!builtin) throw new ShareError('unknown board')
    board = {
      id: builtin.id,
      name: builtin.name,
      roles: { ...builtin.roles },
      rules: { ...builtin.rules },
      verified: builtin.verified,
    }
  } else {
    board = { id: null, name: boardRef[0], roles: boardRef[1], rules: boardRef[2], verified: false }
  }
  const table = unpackSeats(seats)
  if (table.some((s) => !isRoleId(s.role))) throw new ShareError('unknown role')
  const createdAt = minutes * 60000
  return {
    schemaVersion: SCHEMA_VERSION,
    id: newId(),
    createdAt,
    updatedAt: createdAt,
    name,
    seq,
    note,
    board,
    table,
    options: unpackOptions(options),
    events: unpackEvents(inputs),
  }
}

export const encodeGameLink = (game: JudgeGame) => encodePayload(packGame(game))
export const decodeGameLink = async (payload: string) => unpackGame(await decodePayload(payload))
