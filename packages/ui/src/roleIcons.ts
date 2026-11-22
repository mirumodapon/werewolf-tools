import type { Faction, RoleId } from '@werewolf/rules'

/** Tabler icon of each role (whole class names, so UnoCSS generates them). */
export const ROLE_ICONS: Record<RoleId, string> = {
  villager: 'i-tabler-user',
  werewolf: 'i-tabler-paw',
  seer: 'i-tabler-eye',
  witch: 'i-tabler-flask',
  hunter: 'i-tabler-target-arrow',
  guard: 'i-tabler-shield',
  idiot: 'i-tabler-mood-crazy-happy',
  knight: 'i-tabler-sword',
  magician: 'i-tabler-wand',
  gravekeeper: 'i-tabler-grave-2',
  crow: 'i-tabler-feather',
  wolfKing: 'i-tabler-crown',
  whiteWolfKing: 'i-tabler-bomb',
  wolfBeauty: 'i-tabler-flower',
  hiddenWolf: 'i-tabler-mask',
  cupid: 'i-tabler-hearts',
  mixedBlood: 'i-tabler-droplet-half-2',
  wildChild: 'i-tabler-leaf',
}

/** 狼人 red, 神職 blue, 村民 green, 第三方 yellow. */
export const FACTION_CLASSES: Record<Faction, { text: string; bg: string; border: string }> = {
  wolf: { text: 'text-wolf', bg: 'bg-wolf/15', border: 'border-wolf' },
  god: { text: 'text-god', bg: 'bg-god/15', border: 'border-god' },
  village: { text: 'text-village', bg: 'bg-village/15', border: 'border-village' },
  third: { text: 'text-third', bg: 'bg-third/15', border: 'border-third' },
}
