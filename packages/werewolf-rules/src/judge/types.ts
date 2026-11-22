import type { BoardRules } from '../boardRules.ts'
import type { RoleId } from '../roles.ts'
import type { RoleCounts, SeatRole } from '../table.ts'

/** What the moderator assistant needs to run a game. */
export interface JudgeSetup {
  roles: RoleCounts
  rules: BoardRules
  /** Cards already known (e.g. handed over from the deal tool). The rest are found on night 1. */
  table: SeatRole[]
}

export type Side = 'good' | 'wolf' | 'third'
export type Winner = Side | 'none'
export type Phase = 'night' | 'day' | 'ended'

/**
 * Why a player is out. `poison`, `love`, `charm` and `explode` take away 獵人's and 狼王's
 * shot; `blast` is the player 白狼王 takes with him.
 */
export type DeathCause =
  | 'wolf'
  | 'poison'
  | 'shot'
  | 'exile'
  | 'love'
  | 'charm'
  | 'explode'
  | 'blast'
  | 'duel'
  | 'duelLost'

export interface Death {
  cause: DeathCause
  round: number
  phase: 'night' | 'day'
}

export interface Player {
  seat: number
  /** null until the moderator finds out (night 1). */
  role: RoleId | null
  alive: boolean
  death: Death | null
}

/** Steps of a night, in calling order; `identify` asks who holds a role with no night action. */
export type NightStepId =
  | 'dusk'
  | 'cupid'
  | 'lovers'
  | 'mixedBlood'
  | 'wildChild'
  | 'magician'
  | 'guard'
  | 'wolves'
  | 'identify'
  | 'wolfBeauty'
  | 'hiddenWolf'
  | 'witch'
  | 'seer'
  | 'gravekeeper'
  | 'crow'
  | 'hunter'

export type DayStepId = 'sheriff' | 'deaths' | 'shoot' | 'badge' | 'day'
export type StepId = NightStepId | DayStepId

export interface PlanItem {
  id: NightStepId
  /** Whose turn it is (the role called), for steps that call one role. */
  role?: RoleId
}

/**
 * The moderator's inputs, one per step, in order. Every field naming a seat is optional
 * where the role's holder may already be out (the step is then read aloud for show and
 * acknowledged). `assign` and `end` may come at any time.
 */
export type GameEvent =
  | { step: 'dusk' | 'lovers' | 'deaths' }
  | { step: 'cupid'; actor?: number; lovers?: [number, number] }
  | { step: 'mixedBlood' | 'wildChild'; actor?: number; target?: number }
  | { step: 'magician'; actor?: number; swap?: [number, number] | null }
  | { step: 'guard'; actor?: number; target?: number | null }
  | { step: 'wolves'; actors?: number[]; kill?: number | null }
  | { step: 'identify'; role: RoleId; actor: number }
  | { step: 'wolfBeauty'; actor?: number; target?: number | null }
  | { step: 'hiddenWolf'; actor?: number }
  | { step: 'witch'; actor?: number; save?: boolean; poison?: number | null }
  | { step: 'seer'; actor?: number; target?: number | null }
  | { step: 'gravekeeper' | 'hunter'; actor?: number }
  | { step: 'crow'; actor?: number; target?: number | null }
  | { step: 'sheriff'; seat: number | null }
  | { step: 'shoot'; target: number | null }
  | { step: 'badge'; to: number | null }
  | { step: 'day'; action: 'vote'; exiled: number | null }
  | { step: 'day'; action: 'explode'; actor: number; target?: number | null }
  | { step: 'day'; action: 'duel'; actor: number; target: number }
  | { step: 'assign'; seat: number; role: RoleId }
  | { step: 'end'; winner: Winner }

/** Something that happened, for the timeline of a record. */
export type LogEvent =
  | { kind: 'lovers'; seats: [number, number] }
  | { kind: 'model'; role: 'mixedBlood' | 'wildChild'; seat: number; target: number }
  | { kind: 'swap'; seats: [number, number] }
  | { kind: 'guard'; target: number | null }
  | { kind: 'kill'; target: number | null }
  | { kind: 'charm'; target: number | null }
  | { kind: 'save'; target: number }
  | { kind: 'poison'; target: number }
  | { kind: 'check'; target: number; result: 'good' | 'wolf' }
  | { kind: 'gravekeeper'; target: number; result: 'good' | 'wolf' }
  | { kind: 'curse'; target: number | null }
  | { kind: 'announce'; seats: number[] }
  | { kind: 'death'; seat: number; cause: DeathCause }
  | { kind: 'turned'; seat: number }
  | { kind: 'sheriff'; seat: number | null }
  | { kind: 'badge'; from: number; to: number | null }
  | { kind: 'shoot'; seat: number; target: number | null }
  | { kind: 'exile'; seat: number | null }
  | { kind: 'idiot'; seat: number }
  | { kind: 'explode'; seat: number; target: number | null }
  | { kind: 'duel'; seat: number; target: number; success: boolean }
  | { kind: 'assign'; seat: number; role: RoleId }
  | { kind: 'end'; winner: Winner; manual: boolean }

export type LogEntry = LogEvent & { round: number; phase: 'night' | 'day' }

export type Trigger = { kind: 'shoot'; seat: number } | { kind: 'badge'; seat: number }

export interface Tonight {
  swap: [number, number] | null
  /** The guard's choice as made (before any swap): the next night may not repeat it. */
  guard: number | null
  kill: number | null
  save: boolean
  poison: number | null
  charm: number | null
  curse: number | null
}

export interface GameState {
  setup: JudgeSetup
  phase: Phase
  /** Night N is followed by day N. */
  round: number
  players: Player[]
  plan: PlanItem[]
  planIndex: number
  tonight: Tonight
  /** Day progress: sheriff election, announcing the night's deaths, then the day's actions. */
  dayStage: 'sheriff' | 'deaths' | 'action' | 'closing'
  /** Seats that died last night, announced at `deaths`. */
  nightDeaths: number[]
  pending: Trigger[]
  antidote: boolean
  poison: boolean
  guardLast: number | null
  lovers: [number, number] | null
  mixedBloodModel: number | null
  wildChildModel: number | null
  wildChildTurned: boolean
  /** 狼美人's current charm (lasts until her next choice). */
  charm: number | null
  /** 烏鴉's curse for today's vote. */
  curse: number | null
  sheriff: number | null
  knightUsed: boolean
  idiotRevealed: boolean
  /** Exiled during the last day, for 守墓人. */
  lastExiled: number | null
  winner: Winner | null
  log: LogEntry[]
  /** Night 1 ended with cards nobody was identified as (fix with `assign`). */
  unassigned: RoleId[]
}

/** The next thing the moderator has to do, with what the screen needs to show. */
export interface Step {
  id: StepId
  round: number
  role?: RoleId
  /** Known holder of the role called. */
  actor: number | null
  /** The moderator must pick the holder's seat now (first night). */
  identify: boolean
  /** The role's holder is out: read the lines, pause, take no input. */
  dead: boolean
  /** `wolves`: how many wolves wake (to identify) and the known ones. */
  wolves?: { expected: number; seats: number[] }
  guardForbidden?: number | null
  witch?: {
    victim: number | null
    told: boolean
    antidote: boolean
    poison: boolean
    canSave: boolean
  }
  hunterCanShoot?: boolean
  gravekeeper?: { target: number; result: 'good' | 'wolf' } | null
  deaths?: { seats: number[]; lastWords: number[] }
  shooter?: number
  badgeFrom?: number
  day?: {
    sheriff: number | null
    curse: number | null
    cannotVote: number[]
    /** Wolves known to the moderator who may explode (自爆). */
    wolves: number[]
    whiteWolfKing: number | null
    knight: number | null
    knightUnknown: boolean
  }
}
