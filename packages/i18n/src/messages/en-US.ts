import type { Shape } from '../types.ts'
import type zhTW from './zh-TW.ts'

/** Shared strings. Keys must match zh-TW.ts (scripts/check-i18n.ts). */
export default {
  common: {
    back: 'Back',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'OK',
    confirmTitle: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    copy: 'Copy',
    share: 'Share',
    settings: 'Settings',
    info: 'About',
    home: 'Back to home',
    seat: '#{n}',
    players: '{n} players',
    loading: 'Loading…',
    none: 'None',
  },
  status: {
    alpha: 'alpha',
    beta: 'beta',
    rc: 'rc',
    stable: '',
    'coming-soon': 'Coming soon',
  },
  factions: {
    wolf: 'Wolves',
    god: 'Gods',
    village: 'Villagers',
    third: 'Third party',
  },
  roles: {
    villager: { name: 'Villager', desc: 'No power; find the wolves by reasoning' },
    werewolf: { name: 'Werewolf', desc: 'Kills one player each night with the pack' },
    seer: { name: 'Seer', desc: 'Checks whether one player is good or a wolf each night' },
    witch: {
      name: 'Witch',
      desc: 'One antidote and one poison, each used once, never both on one night',
    },
    hunter: {
      name: 'Hunter',
      desc: 'When out, may shoot one player (not when poisoned or heartbroken)',
    },
    guard: { name: 'Guard', desc: 'Protects one player from the wolves; never twice in a row' },
    idiot: { name: 'Idiot', desc: 'Survives the first exile by revealing, but can no longer vote' },
    knight: {
      name: 'Knight',
      desc: 'May duel a player by day: a wolf dies and night falls, otherwise the knight dies',
    },
    magician: {
      name: 'Magician',
      desc: 'Swaps two players each night; actions on them are swapped too',
    },
    gravekeeper: {
      name: 'Gravekeeper',
      desc: 'Learns each night whether the last exiled player was good or a wolf',
    },
    crow: { name: 'Crow', desc: 'Curses one player each night: one extra vote against them' },
    wolfKing: {
      name: 'Wolf King',
      desc: 'Known to the pack; when out, may shoot one player (not when poisoned)',
    },
    whiteWolfKing: { name: 'White Wolf King', desc: 'May explode by day, taking one player along' },
    wolfBeauty: {
      name: 'Wolf Beauty',
      desc: 'Charms one player each night, who dies with her',
    },
    hiddenWolf: {
      name: 'Hidden Wolf',
      desc: 'Knows the pack, unknown to it, checks as good; kills once the pack is gone',
    },
    cupid: { name: 'Cupid', desc: 'Links two lovers on night one; if one dies, so does the other' },
    mixedBlood: {
      name: 'Mixed Blood',
      desc: 'Picks a role model on night one and joins their side',
    },
    wildChild: {
      name: 'Wild Child',
      desc: 'Picks a role model; becomes a wolf when the model dies',
    },
  },
  boards: {
    players: 'Players',
    board: 'Board',
    noneForCount:
      'No board for {n} players yet. Make one in Role Deal, or copy the closest board and adjust it.',
    builtin: 'Built-in',
    custom: 'Custom',
    unverified: 'Unverified',
    unverifiedHint:
      'The moderator logic for this board has not been checked by a person yet; double-check as you go.',
    untitled: 'Untitled board',
    noIssues: 'Looks good',
    total: '{n} players',
  },
  rules: {
    title: 'Board settings',
    win: { label: 'Wolves win', side: 'Side kill', city: 'Kill all' },
    winHint: {
      side: 'Wolves win once every god or every villager is out',
      city: 'Wolves win once every good player is out',
    },
    guardSaveConflict: {
      label: 'Guarded and saved',
      dies: 'Dies',
      lives: 'Lives',
    },
    sheriff: { label: 'Sheriff election', on: 'Yes', off: 'No' },
    lastWords: {
      label: 'Last words after dying at night',
      firstNight: 'Night one only',
      always: 'Every night',
      never: 'Never',
    },
  },
  check: {
    playerCount: 'Needs {min}–{max} players (now {count})',
    noWolves: 'Add at least one wolf',
    uniqueRole: 'Only one {role} allowed (now {count})',
    badCount: 'Counts must be whole numbers, 0 or more',
    fewWolves: '{wolves} wolves is few for this table (20%–40% suggested)',
    manyWolves: '{wolves} wolves is many for this table (20%–40% suggested)',
    noGods: 'No gods on this board',
    complexRole: '{role} works best with {min}+ players',
  },
  theme: {
    label: 'Theme',
    system: 'System',
    night: 'Night',
    storm: 'Storm',
    light: 'Light',
  },
  locale: {
    label: 'Language',
    'zh-TW': '繁體中文',
    'en-US': 'English',
  },
  update: {
    checking: 'Checking for updates…',
    updating: 'Updating…',
  },
  storage: {
    label: 'Storage',
    usage: '{used} of {quota} used',
    unknown: 'Not available',
    persisted: 'Persistent storage granted',
    notPersisted: 'The browser may clear data when space runs low',
  },
  reset: {
    title: 'Delete all data',
    hint: 'Deletes every tool’s data on this device: custom boards, deals, game records and settings. This cannot be undone.',
    confirm:
      'Delete all data of every tool? Custom boards, deals, game records and settings will be gone for good.',
    action: 'Delete all data',
  },
  share: {
    copyLink: 'Copy link',
    copied: 'Copied',
    system: 'Share via…',
    qr: 'Scan the QR code with a camera to open it',
  },
} satisfies Shape<typeof zhTW>
