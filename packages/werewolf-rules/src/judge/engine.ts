/**
 * The moderator assistant's rules: which step comes next, and what each input does.
 * Pure functions over plain data; a game is its setup plus the list of inputs, and every
 * state is replayed from them (see derive.ts), so undo is "drop the last input".
 */
import { ROLES, type RoleId } from '../roles.ts'
import { expandRoles } from '../table.ts'
import { resolveOptions, witchMaySaveSelf } from './options.ts'
import type {
  DeathCause,
  GameEvent,
  GameState,
  JudgeSetup,
  LogEvent,
  NightStepId,
  PlanItem,
  Player,
  Side,
  Step,
  Tonight,
  Winner,
} from './types.ts'

export class JudgeError extends Error {
  override name = 'JudgeError'
}

/** Wolves that wake up to kill from the first night (隱狼 joins later). */
export const PACK_ROLES: readonly RoleId[] = ['werewolf', 'wolfKing', 'whiteWolfKing', 'wolfBeauty']
/** Special wolves without a night action of their own: pointed out among the pack on night 1. */
export const PACK_SPECIALS = ['wolfKing', 'whiteWolfKing'] as const
/** Roles without a night action, identified at the end of night 1. */
export const IDENTIFY_ROLES: readonly RoleId[] = ['wolfKing', 'whiteWolfKing', 'idiot', 'knight']
/** Deaths that take away 獵人's and 狼王's shot. */
export const NO_SHOT_CAUSES: readonly DeathCause[] = ['poison', 'love', 'charm', 'explode']
/** Day deaths without last words. */
const SILENT_DAY_CAUSES: readonly DeathCause[] = ['explode', 'blast', 'duel', 'duelLost']

const EMPTY_NIGHT: Tonight = {
  swap: null,
  guard: null,
  kill: null,
  save: false,
  poison: null,
  charm: null,
  curse: null,
}

// ─── Queries ────────────────────────────────────────────────────────────────

export const present = (state: GameState, role: RoleId) => (state.setup.roles[role] ?? 0) > 0

export function player(state: GameState, seat: number): Player {
  const p = state.players[seat - 1]
  if (!p) throw new JudgeError(`no seat ${seat}`)
  return p
}

export const holder = (state: GameState, role: RoleId): Player | undefined =>
  state.players.find((p) => p.role === role)

export const alive = (state: GameState) => state.players.filter((p) => p.alive)

/** Whether `seat` is on the wolves' side right now (turned 野孩子 included). */
export function isWolf(state: GameState, seat: number): boolean {
  const p = player(state, seat)
  if (!p.role) return false
  if (p.role === 'wildChild') return state.wildChildTurned
  if (p.role === 'mixedBlood') {
    const model = state.mixedBloodModel
    return model !== null && model !== seat && isWolf(state, model)
  }
  return ROLES[p.role].faction === 'wolf'
}

/** What 預言家 sees: 隱狼 looks good. */
export function seerResult(state: GameState, target: number): 'good' | 'wolf' {
  const seat = mapSeat(state.tonight, target)
  if (player(state, seat).role === 'hiddenWolf') return 'good'
  return isWolf(state, seat) ? 'wolf' : 'good'
}

/** Seats of the wolves who wake to kill tonight. 隱狼 joins once the rest of the pack is out. */
export function killers(state: GameState): Player[] {
  const pack = alive(state).filter(
    (p) =>
      (p.role && packRoles(state).includes(p.role)) ||
      (p.role === 'wildChild' && state.wildChildTurned),
  )
  if (pack.length) return pack
  // The pack is out: wolves kept apart (隱狼, and 狼王 when he does not meet the pack) take over.
  return alive(state).filter((p) => p.role === 'hiddenWolf' || p.role === 'wolfKing')
}

/** Roles that wake with the pack from the first night (狼王 only when he meets the pack). */
export function packRoles(state: GameState): readonly RoleId[] {
  return resolveOptions(state.setup.options).wolfKingMeetsPack
    ? PACK_ROLES
    : PACK_ROLES.filter((r) => r !== 'wolfKing')
}

/** Lovers from opposite sides (人狼戀) play for themselves, with 丘比特. */
export function thirdParty(state: GameState): number[] {
  const lovers = state.lovers
  if (!lovers) return []
  const [a, b] = lovers
  if (isWolf(state, a) === isWolf(state, b)) return []
  const cupid = holder(state, 'cupid')
  return cupid && !lovers.includes(cupid.seat) ? [a, b, cupid.seat] : [a, b]
}

export function sideOf(state: GameState, seat: number): Side {
  if (thirdParty(state).includes(seat)) return 'third'
  return isWolf(state, seat) ? 'wolf' : 'good'
}

/** The swapped seat when 魔術師 traded these two tonight. */
export function mapSeat(tonight: Tonight, seat: number): number {
  if (!tonight.swap) return seat
  const [a, b] = tonight.swap
  return seat === a ? b : seat === b ? a : seat
}

export function canShoot(state: GameState, p: Player): boolean {
  if ((p.role !== 'hunter' && p.role !== 'wolfKing') || p.alive || !p.death) return false
  if (
    p.role === 'wolfKing' &&
    p.death.cause === 'explode' &&
    resolveOptions(state.setup.options).wolfKingShootAfterExplode
  )
    return true
  return !NO_SHOT_CAUSES.includes(p.death.cause)
}

/** Night deaths that may speak, by the board's rule. */
export function lastWordsOf(state: GameState, seats: readonly number[]): number[] {
  const rule = state.setup.rules.lastWords
  if (rule === 'never' || (rule === 'firstNight' && state.round !== 1)) return []
  return [...seats]
}

export function checkWinner(state: GameState): Winner | null {
  const living = alive(state)
  if (!living.length) return 'none'
  const third = thirdParty(state)
  const thirdAlive = living.filter((p) => third.includes(p.seat))
  if (thirdAlive.length === living.length) return 'third'
  if (thirdAlive.length) return null
  const wolves = living.filter((p) => isWolf(state, p.seat))
  if (!wolves.length) return 'good'
  const good = living.filter((p) => !isWolf(state, p.seat))
  if (state.setup.rules.win === 'city') return good.length ? null : 'wolf'
  const isGod = (p: Player) => p.role !== null && ROLES[p.role].faction === 'god'
  const hadGods = expandRoles(state.setup.roles).some((r) => ROLES[r].faction === 'god')
  const hadVillagers = expandRoles(state.setup.roles).some(
    (r) => ROLES[r].faction !== 'god' && ROLES[r].faction !== 'wolf',
  )
  const godsOut = hadGods && !good.some(isGod)
  const villagersOut = hadVillagers && !good.some((p) => !isGod(p))
  return godsOut || villagersOut || !good.length ? 'wolf' : null
}

/**
 * What the witch is told and may do. After the antidote is gone she is no longer told
 * (unless the `witchToldAfterAntidote` option says so)
 * who was attacked. Pass the witch's seat once known (night 1 identifies her first).
 */
export function witchOptions(state: GameState, witch: Player | null): NonNullable<Step['witch']> {
  const t = state.tonight
  const victim = t.kill === null ? null : mapSeat(t, t.kill)
  const told =
    (state.antidote || resolveOptions(state.setup.options).witchToldAfterAntidote) &&
    witch?.alive !== false
  const selfOk = witchMaySaveSelf(resolveOptions(state.setup.options).witchSelfSave, state.round)
  const self = witch !== null && victim === witch.seat
  return {
    victim: told ? victim : null,
    told,
    antidote: state.antidote,
    poison: state.poison,
    canSave: state.antidote && told && victim !== null && (!self || selfOk),
  }
}

// ─── Setup and the night plan ────────────────────────────────────────────────

export function initialState(input: JudgeSetup): GameState {
  // Own plain copies: callers may pass proxies (Vue state) that structuredClone refuses.
  const setup: JudgeSetup = {
    roles: { ...input.roles },
    rules: { ...input.rules },
    table: input.table.map((s) => ({ seat: s.seat, role: s.role })),
    options: { ...input.options },
  }
  const count = expandRoles(setup.roles).length
  const known = new Map(setup.table.map((s) => [s.seat, s.role]))
  const state: GameState = {
    setup,
    phase: 'night',
    round: 1,
    players: Array.from({ length: count }, (_, i) => ({
      seat: i + 1,
      role: known.get(i + 1) ?? null,
      alive: true,
      death: null,
    })),
    plan: [],
    planIndex: 0,
    tonight: { ...EMPTY_NIGHT },
    dayStage: 'action',
    nightDeaths: [],
    pending: [],
    antidote: true,
    poison: true,
    guardLast: null,
    lovers: null,
    mixedBloodModel: null,
    wildChildModel: null,
    wildChildTurned: false,
    charm: null,
    curse: null,
    sheriff: null,
    knightUsed: false,
    idiotRevealed: false,
    lastExiled: null,
    winner: null,
    log: [],
    unassigned: [],
  }
  state.plan = nightPlan(state)
  return state
}

/** The roles called tonight, in order. Roles that are out are still called (for show). */
export function nightPlan(state: GameState): PlanItem[] {
  const first = state.round === 1
  const has = (r: RoleId) => present(state, r)
  const plan: PlanItem[] = [{ id: 'dusk' }]
  const call = (id: NightStepId, role: RoleId) => {
    if (has(role)) plan.push({ id, role })
  }
  if (first) {
    if (has('cupid')) plan.push({ id: 'cupid', role: 'cupid' }, { id: 'lovers' })
    call('mixedBlood', 'mixedBlood')
    call('wildChild', 'wildChild')
  }
  call('magician', 'magician')
  call('guard', 'guard')
  if (PACK_ROLES.some(has) || has('hiddenWolf')) plan.push({ id: 'wolves', role: 'werewolf' })
  // Special wolves who wake with the pack are pointed out during the wolves' turn; only
  // those kept apart (狼王 not meeting the pack) are called on their own.
  if (first)
    for (const role of PACK_SPECIALS)
      if (has(role) && !holder(state, role) && !packRoles(state).includes(role))
        plan.push({ id: 'identify', role })
  call('wolfBeauty', 'wolfBeauty')
  if (first) call('hiddenWolf', 'hiddenWolf')
  call('witch', 'witch')
  call('seer', 'seer')
  call('gravekeeper', 'gravekeeper')
  call('crow', 'crow')
  call('hunter', 'hunter')
  if (first)
    for (const role of ['idiot', 'knight'] as const)
      if (has(role) && !holder(state, role)) plan.push({ id: 'identify', role })
  return plan
}

// ─── Next step ──────────────────────────────────────────────────────────────

export function nextStep(state: GameState): Step | null {
  if (state.phase === 'ended') return null
  const base = { round: state.round, actor: null, identify: false, dead: false }
  if (state.phase === 'night') {
    const item = state.plan[state.planIndex]
    if (!item) return null
    return nightStep(state, item, base)
  }
  if (state.dayStage === 'sheriff') return { ...base, id: 'sheriff' }
  if (state.dayStage === 'deaths') {
    return {
      ...base,
      id: 'deaths',
      deaths: { seats: state.nightDeaths, lastWords: lastWordsOf(state, state.nightDeaths) },
    }
  }
  const trigger = state.pending[0]
  if (trigger?.kind === 'shoot') {
    return {
      ...base,
      id: 'shoot',
      role: player(state, trigger.seat).role ?? undefined,
      actor: trigger.seat,
      shooter: trigger.seat,
    }
  }
  if (trigger?.kind === 'badge')
    return { ...base, id: 'badge', actor: trigger.seat, badgeFrom: trigger.seat }
  const knight = holder(state, 'knight')
  const wwk = holder(state, 'whiteWolfKing')
  return {
    ...base,
    id: 'day',
    day: {
      sheriff: state.sheriff,
      curse: state.curse,
      cannotVote:
        state.idiotRevealed && holder(state, 'idiot')?.alive ? [holder(state, 'idiot')!.seat] : [],
      wolves: alive(state)
        .filter((p) => p.role && ROLES[p.role].faction === 'wolf')
        .map((p) => p.seat),
      whiteWolfKing: wwk?.alive ? wwk.seat : null,
      knight: knight?.alive && !state.knightUsed ? knight.seat : null,
      knightUnknown: present(state, 'knight') && !knight && !state.knightUsed,
    },
  }
}

function nightStep(
  state: GameState,
  item: PlanItem,
  base: Pick<Step, 'round' | 'actor' | 'identify' | 'dead'>,
): Step {
  const step: Step = { ...base, id: item.id, role: item.role }
  if (item.id === 'dusk' || item.id === 'lovers') return step
  if (item.id === 'wolves') {
    const seats = killers(state).map((p) => p.seat)
    const anyKnown = state.players.some(
      (p) => p.role && (PACK_ROLES.includes(p.role) || p.role === 'hiddenWolf'),
    )
    const expected = packRoles(state).reduce((n, r) => n + (state.setup.roles[r] ?? 0), 0)
    const identifying = !anyKnown && expected > 0
    const specials = identifying
      ? PACK_SPECIALS.filter((r) => present(state, r) && packRoles(state).includes(r))
      : []
    return {
      ...step,
      identify: identifying,
      dead: anyKnown && !seats.length,
      wolves: { expected, seats, specials },
    }
  }
  const role = item.role!
  const h = holder(state, role)
  step.actor = h?.seat ?? null
  step.identify = !h
  step.dead = Boolean(h && !h.alive)
  if (item.id === 'identify') return step
  if (item.id === 'guard') step.guardForbidden = state.guardLast
  if (item.id === 'witch') step.witch = witchOptions(state, h ?? null)
  if (item.id === 'hunter') {
    const poisoned =
      state.tonight.poison === null ? null : mapSeat(state.tonight, state.tonight.poison)
    step.hunterCanShoot = !(h && poisoned === h.seat)
  }
  if (item.id === 'gravekeeper') {
    const t = state.lastExiled
    step.gravekeeper = t === null ? null : { target: t, result: isWolf(state, t) ? 'wolf' : 'good' }
  }
  return step
}

// ─── Applying an input ──────────────────────────────────────────────────────

const log = (
  state: GameState,
  event: LogEvent,
  phase: 'night' | 'day' = state.phase === 'night' ? 'night' : 'day',
) => state.log.push({ ...event, round: state.round, phase } as GameState['log'][number])

function seatOk(state: GameState, seat: unknown, { living = true } = {}): number {
  if (typeof seat !== 'number' || !Number.isInteger(seat)) throw new JudgeError('seat expected')
  const p = player(state, seat)
  if (living && !p.alive) throw new JudgeError(`seat ${seat} is out`)
  return seat
}

/** Records who holds `role` (first night) and checks it is consistent. */
function identify(state: GameState, role: RoleId, seat: number) {
  const p = player(state, seat)
  if (p.role === role) return
  const pack = PACK_ROLES.includes(role) && p.role === 'werewolf'
  if (p.role !== null && !pack) throw new JudgeError(`seat ${seat} is already ${p.role}`)
  if (ROLES[role].unique && holder(state, role))
    throw new JudgeError(`${role} is already seat ${holder(state, role)!.seat}`)
  p.role = role
}

function actorOf(
  state: GameState,
  role: RoleId,
  actor: number | undefined,
  step: Step,
): number | null {
  if (step.dead) return null
  if (step.identify) {
    if (actor === undefined) throw new JudgeError(`who is the ${role}?`)
    identify(state, role, seatOk(state, actor))
    return actor
  }
  return step.actor
}

/** Puts a player out, with everything that follows (lovers, charm, 野孩子). */
export function kill(state: GameState, seat: number, cause: DeathCause): void {
  const p = player(state, seat)
  if (!p.alive) return
  const phase = state.phase === 'night' ? 'night' : 'day'
  p.alive = false
  p.death = { cause, round: state.round, phase }
  log(state, { kind: 'death', seat, cause }, phase)
  if (phase === 'day') queueTriggers(state, seat)
  else state.nightDeaths.push(seat)
  if (state.wildChildModel === seat) {
    const child = holder(state, 'wildChild')
    if (child?.alive && !state.wildChildTurned) {
      state.wildChildTurned = true
      log(state, { kind: 'turned', seat: child.seat }, phase)
    }
  }
  if (p.role === 'wolfBeauty' && state.charm !== null) kill(state, state.charm, 'charm')
  if (state.lovers?.includes(seat))
    kill(state, state.lovers[0] === seat ? state.lovers[1] : state.lovers[0], 'love')
}

function queueTriggers(state: GameState, seat: number) {
  const p = player(state, seat)
  if (state.sheriff === seat) state.pending.push({ kind: 'badge', seat })
  if (canShoot(state, p)) state.pending.push({ kind: 'shoot', seat })
}

function endGame(state: GameState, winner: Winner, manual: boolean) {
  state.winner = winner
  state.phase = 'ended'
  state.pending = []
  log(state, { kind: 'end', winner, manual })
}

/** After deaths: stops the game when a side has won. */
function settle(state: GameState): boolean {
  const winner = checkWinner(state)
  if (winner) endGame(state, winner, false)
  return winner !== null
}

function startDay(state: GameState) {
  const t = state.tonight
  const victim = t.kill === null ? null : mapSeat(t, t.kill)
  const guarded = t.guard === null ? null : mapSeat(t, t.guard)
  state.nightDeaths = []
  if (victim !== null) {
    const isGuarded = guarded === victim
    const dies =
      isGuarded && t.save ? state.setup.rules.guardSaveConflict === 'dies' : !isGuarded && !t.save
    if (dies) kill(state, victim, 'wolf')
  }
  if (t.poison !== null) kill(state, mapSeat(t, t.poison), 'poison')
  state.nightDeaths.sort((a, b) => a - b)
  state.guardLast = t.guard
  state.curse = t.curse
  state.lastExiled = null
  if (state.round === 1) assignRest(state)
  state.phase = 'day'
  state.dayStage = state.round === 1 && state.setup.rules.sheriff ? 'sheriff' : 'deaths'
}

/** After night 1, seats nobody was identified as hold the remaining cards (all 村民). */
function assignRest(state: GameState) {
  const remaining = expandRoles(state.setup.roles)
  for (const p of state.players) {
    if (!p.role) continue
    const i = remaining.indexOf(p.role)
    if (i > -1) remaining.splice(i, 1)
  }
  const unknown = state.players.filter((p) => !p.role)
  if (remaining.every((r) => r === 'villager')) for (const p of unknown) p.role = 'villager'
  state.unassigned = remaining.filter((r) => r !== 'villager' || unknown.length === 0)
}

function startNight(state: GameState) {
  state.round += 1
  state.phase = 'night'
  state.tonight = { ...EMPTY_NIGHT }
  state.curse = null
  state.plan = nightPlan(state)
  state.planIndex = 0
}

/** Ends the day once pending shots and badges are done (unless someone has won). */
function afterDayDeaths(state: GameState) {
  if (state.pending.length) return
  if (settle(state)) return
  if (state.dayStage === 'closing') startNight(state)
}

/** Applies one input. Throws JudgeError when it does not fit the current step. */
export function applyEvent(prev: GameState, event: GameEvent): GameState {
  const state = structuredClone(prev)
  if (event.step === 'end') {
    if (state.phase === 'ended') throw new JudgeError('the game is over')
    endGame(state, event.winner, true)
    return state
  }
  if (event.step === 'assign') {
    const p = player(state, event.seat)
    p.role = event.role
    state.unassigned = []
    log(state, { kind: 'assign', seat: event.seat, role: event.role })
    return state
  }
  const step = nextStep(state)
  if (!step) throw new JudgeError('the game is over')
  if (step.id !== event.step) throw new JudgeError(`expected ${step.id}, got ${event.step}`)
  if (state.phase === 'night') applyNight(state, event, step)
  else applyDay(state, event, step)
  return state
}

function applyNight(state: GameState, event: GameEvent, step: Step) {
  const t = state.tonight
  switch (event.step) {
    case 'dusk':
    case 'lovers':
      break
    case 'cupid': {
      if (actorOf(state, 'cupid', event.actor, step) === null) break
      const [a, b] = event.lovers ?? []
      if (a === undefined || b === undefined || a === b) throw new JudgeError('two lovers expected')
      state.lovers = [seatOk(state, a), seatOk(state, b)].toSorted((x, y) => x - y) as [
        number,
        number,
      ]
      log(state, { kind: 'lovers', seats: state.lovers })
      break
    }
    case 'mixedBlood':
    case 'wildChild': {
      const actor = actorOf(state, event.step, event.actor, step)
      if (actor === null) break
      const target = seatOk(state, event.target)
      if (target === actor) throw new JudgeError('cannot pick oneself')
      if (event.step === 'mixedBlood') state.mixedBloodModel = target
      else state.wildChildModel = target
      log(state, { kind: 'model', role: event.step, seat: actor, target })
      break
    }
    case 'magician': {
      if (actorOf(state, 'magician', event.actor, step) === null) break
      if (event.swap) {
        const [a, b] = event.swap
        if (a === b) throw new JudgeError('swap two different seats')
        t.swap = [seatOk(state, a), seatOk(state, b)]
        log(state, { kind: 'swap', seats: t.swap })
      }
      break
    }
    case 'guard': {
      if (actorOf(state, 'guard', event.actor, step) === null) break
      const target = event.target ?? null
      if (target !== null) {
        seatOk(state, target)
        if (target === state.guardLast)
          throw new JudgeError('cannot guard the same seat twice in a row')
        if (
          !resolveOptions(state.setup.options).guardSelf &&
          target === holder(state, 'guard')?.seat
        )
          throw new JudgeError('the guard cannot protect himself')
      }
      t.guard = target
      log(state, { kind: 'guard', target })
      break
    }
    case 'wolves': {
      if (step.dead) break
      if (step.identify) {
        const actors = event.actors ?? []
        if (!actors.length) throw new JudgeError('which seats are wolves?')
        for (const seat of actors) identify(state, 'werewolf', seatOk(state, seat))
        for (const role of step.wolves?.specials ?? []) {
          const seat = event.specials?.[role]
          if (seat === undefined || !actors.includes(seat))
            throw new JudgeError(`which of the wolves is the ${role}?`)
          identify(state, role, seat)
        }
      }
      const kill = event.kill ?? null
      if (kill !== null) seatOk(state, kill)
      t.kill = kill
      log(state, { kind: 'kill', target: kill })
      break
    }
    case 'identify':
      identify(state, event.role, seatOk(state, event.actor, { living: false }))
      break
    case 'wolfBeauty': {
      const actor = actorOf(state, 'wolfBeauty', event.actor, step)
      if (actor === null) break
      const target = event.target ?? null
      if (target !== null && seatOk(state, target) === actor)
        throw new JudgeError('cannot charm oneself')
      state.charm = target === null ? null : mapSeat(t, target)
      t.charm = target
      log(state, { kind: 'charm', target })
      break
    }
    case 'hiddenWolf':
      actorOf(state, 'hiddenWolf', event.actor, step)
      break
    case 'witch': {
      const actor = actorOf(state, 'witch', event.actor, step)
      if (actor === null) break
      const info = witchOptions(state, player(state, actor))
      const save = Boolean(event.save)
      const poison = event.poison ?? null
      if (save && poison !== null) throw new JudgeError('only one potion a night')
      if (save) {
        if (!info.canSave) throw new JudgeError('the antidote cannot be used now')
        t.save = true
        state.antidote = false
        log(state, { kind: 'save', target: info.victim! })
      }
      if (poison !== null) {
        if (!state.poison) throw new JudgeError('the poison is used up')
        seatOk(state, poison)
        t.poison = poison
        state.poison = false
        log(state, { kind: 'poison', target: poison })
      }
      break
    }
    case 'seer': {
      if (actorOf(state, 'seer', event.actor, step) === null) break
      const target = event.target ?? null
      if (target !== null)
        log(state, {
          kind: 'check',
          target: seatOk(state, target, { living: false }),
          result: seerResult(state, target),
        })
      break
    }
    case 'gravekeeper': {
      if (actorOf(state, 'gravekeeper', event.actor, step) === null) break
      const info = nightStep(state, { id: 'gravekeeper', role: 'gravekeeper' }, step).gravekeeper
      if (info) log(state, { kind: 'gravekeeper', target: info.target, result: info.result })
      break
    }
    case 'crow': {
      if (actorOf(state, 'crow', event.actor, step) === null) break
      const target = event.target ?? null
      if (target !== null) seatOk(state, target)
      t.curse = target
      log(state, { kind: 'curse', target })
      break
    }
    case 'hunter':
      actorOf(state, 'hunter', event.actor, step)
      break
    default:
      throw new JudgeError(`${event.step} is not a night step`)
  }
  state.planIndex += 1
  if (state.planIndex >= state.plan.length) startDay(state)
}

function applyDay(state: GameState, event: GameEvent, step: Step) {
  switch (event.step) {
    case 'sheriff': {
      // The night's dead may still run: they do not know yet.
      const seat = event.seat === null ? null : seatOk(state, event.seat, { living: false })
      state.sheriff = seat
      log(state, { kind: 'sheriff', seat })
      state.dayStage = 'deaths'
      return
    }
    case 'deaths': {
      log(state, { kind: 'announce', seats: state.nightDeaths })
      state.dayStage = 'action'
      if (settle(state)) return
      for (const seat of state.nightDeaths) queueTriggers(state, seat)
      return
    }
    case 'badge': {
      const to = event.to === null ? null : seatOk(state, event.to)
      state.pending.shift()
      state.sheriff = to
      log(state, { kind: 'badge', from: step.badgeFrom!, to })
      afterDayDeaths(state)
      return
    }
    case 'shoot': {
      const shooter = step.shooter!
      state.pending.shift()
      const target = event.target === null ? null : seatOk(state, event.target)
      log(state, { kind: 'shoot', seat: shooter, target })
      if (target !== null) kill(state, target, 'shot')
      afterDayDeaths(state)
      return
    }
    case 'day':
      return applyDayAction(state, event)
    default:
      throw new JudgeError(`${event.step} is not a day step`)
  }
}

function applyDayAction(state: GameState, event: Extract<GameEvent, { step: 'day' }>) {
  if (event.action === 'vote') {
    state.dayStage = 'closing'
    const seat = event.exiled === null ? null : seatOk(state, event.exiled)
    log(state, { kind: 'exile', seat })
    if (seat !== null) {
      const p = player(state, seat)
      if (p.role === 'idiot' && !state.idiotRevealed) {
        state.idiotRevealed = true
        log(state, { kind: 'idiot', seat })
      } else {
        state.lastExiled = seat
        kill(state, seat, 'exile')
      }
    }
    return afterDayDeaths(state)
  }
  if (event.action === 'explode') {
    const actor = seatOk(state, event.actor)
    const p = player(state, actor)
    if (p.role === null) identify(state, 'werewolf', actor)
    if (!p.role || ROLES[p.role].faction !== 'wolf') throw new JudgeError('only wolves explode')
    const target =
      p.role === 'whiteWolfKing' && event.target != null ? seatOk(state, event.target) : null
    if (target === actor) throw new JudgeError('cannot take oneself')
    state.dayStage = 'closing'
    log(state, { kind: 'explode', seat: actor, target })
    kill(state, actor, 'explode')
    if (target !== null) kill(state, target, 'blast')
    return afterDayDeaths(state)
  }
  // duel
  if (state.knightUsed) throw new JudgeError('the knight has dueled already')
  const knight = seatOk(state, event.actor)
  identify(state, 'knight', knight)
  const target = seatOk(state, event.target)
  if (target === knight) throw new JudgeError('cannot duel oneself')
  state.knightUsed = true
  const success = isWolf(state, target)
  log(state, { kind: 'duel', seat: knight, target, success })
  if (success) {
    state.dayStage = 'closing'
    kill(state, target, 'duel')
  } else {
    kill(state, knight, 'duelLost')
  }
  afterDayDeaths(state)
}

/** Day deaths that may give last words. */
export const hasLastWords = (cause: DeathCause) => !SILENT_DAY_CAUSES.includes(cause)
