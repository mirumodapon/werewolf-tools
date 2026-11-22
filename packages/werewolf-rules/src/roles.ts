/**
 * Roles. Names and one-line descriptions are in `@werewolf/i18n` (`roles.<id>.name`,
 * `roles.<id>.desc`); icons in `@werewolf/ui`.
 */

/** 狼人 red, 神職 blue, 村民 green, 第三方 yellow. */
export const FACTIONS = ['wolf', 'god', 'village', 'third'] as const
export type Faction = (typeof FACTIONS)[number]

/** Fixed order: editors, the share format and faction lists follow it. Append only. */
export const ROLE_IDS = [
  'werewolf',
  'wolfKing',
  'whiteWolfKing',
  'wolfBeauty',
  'hiddenWolf',
  'seer',
  'witch',
  'hunter',
  'guard',
  'idiot',
  'knight',
  'magician',
  'gravekeeper',
  'crow',
  'villager',
  'cupid',
  'mixedBlood',
  'wildChild',
] as const
export type RoleId = (typeof ROLE_IDS)[number]

export interface RoleDef {
  id: RoleId
  faction: Faction
  /** At most one card per game (all but 村民 and 狼人). */
  unique: boolean
  /** Needs a bigger table; `checkBoard` warns below MIN_PLAYERS_FOR_COMPLEX. */
  complex: boolean
}

const role = (id: RoleId, faction: Faction, extra: Partial<RoleDef> = {}): RoleDef => ({
  id,
  faction,
  unique: true,
  complex: false,
  ...extra,
})

export const ROLES: Record<RoleId, RoleDef> = {
  werewolf: role('werewolf', 'wolf', { unique: false }),
  wolfKing: role('wolfKing', 'wolf'),
  whiteWolfKing: role('whiteWolfKing', 'wolf'),
  wolfBeauty: role('wolfBeauty', 'wolf'),
  hiddenWolf: role('hiddenWolf', 'wolf'),
  seer: role('seer', 'god'),
  witch: role('witch', 'god'),
  hunter: role('hunter', 'god'),
  guard: role('guard', 'god'),
  idiot: role('idiot', 'god'),
  knight: role('knight', 'god'),
  magician: role('magician', 'god', { complex: true }),
  gravekeeper: role('gravekeeper', 'god'),
  crow: role('crow', 'god'),
  villager: role('villager', 'village', { unique: false }),
  cupid: role('cupid', 'third', { complex: true }),
  mixedBlood: role('mixedBlood', 'third', { complex: true }),
  wildChild: role('wildChild', 'third', { complex: true }),
}

export function isRoleId(value: unknown): value is RoleId {
  return typeof value === 'string' && (ROLE_IDS as readonly string[]).includes(value)
}

export const factionOf = (id: RoleId): Faction => ROLES[id].faction

export function rolesOf(faction: Faction): RoleId[] {
  return ROLE_IDS.filter((id) => ROLES[id].faction === faction)
}
