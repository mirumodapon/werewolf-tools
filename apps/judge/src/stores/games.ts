import type { Handoff } from '@werewolf/boards'
import type { Board, GameEvent, JudgeOptions, Winner } from '@werewolf/rules'
import { newId } from '@werewolf/storage'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { boardOf, derive, nextSeq, SCHEMA_VERSION, type JudgeGame } from '../games/game.ts'
import { repository } from '../games/repository.ts'

/** A plain copy: works on Vue's reactive proxies, which structuredClone refuses. */
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Every saved game, and the one being moderated (saved after each input). */
export const useGamesStore = defineStore('games', () => {
  const games = ref<JudgeGame[]>([])
  const loaded = ref(false)
  const current = ref<JudgeGame | null>(null)
  const derived = computed(() => (current.value ? derive(current.value) : null))

  async function load() {
    games.value = await (await repository()).list()
    loaded.value = true
  }

  async function save(game: JudgeGame) {
    game.updatedAt = Date.now()
    await (await repository()).put(clone(game))
    const i = games.value.findIndex((g) => g.id === game.id)
    if (i === -1) games.value.unshift(clone(game))
    else games.value[i] = clone(game)
  }

  async function create(
    board: Board,
    handoff?: Handoff,
    options: JudgeOptions = {},
    now = Date.now(),
  ): Promise<JudgeGame> {
    if (!loaded.value) await load()
    const game: JudgeGame = {
      schemaVersion: SCHEMA_VERSION,
      id: newId(),
      createdAt: now,
      updatedAt: now,
      name: '',
      seq: nextSeq(games.value, now),
      note: '',
      board: handoff
        ? { ...boardOf(board), name: handoff.boardName, roles: handoff.roles, rules: handoff.rules }
        : boardOf(board),
      table: handoff?.table ?? [],
      options: { ...options },
      events: [],
    }
    await save(game)
    current.value = game
    return game
  }

  async function open(id: string): Promise<JudgeGame | null> {
    if (current.value?.id === id) return current.value
    const game = (await (await repository()).get(id)) ?? null
    current.value = game
    return game
  }

  async function update(change: (game: JudgeGame) => void) {
    if (!current.value) return
    const next = clone(current.value)
    change(next)
    current.value = next
    await save(next)
  }

  const apply = (event: GameEvent) => update((g) => void g.events.push(event))
  const undo = () => update((g) => void g.events.pop())
  const end = (winner: Winner) => apply({ step: 'end', winner })
  const rename = (name: string) => update((g) => void (g.name = name.trim()))
  const setNote = (note: string) => update((g) => void (g.note = note))

  async function remove(id: string) {
    await (await repository()).delete(id)
    games.value = games.value.filter((g) => g.id !== id)
    if (current.value?.id === id) current.value = null
  }

  /** A new game with the same board and known cards. */
  async function duplicate(game: JudgeGame): Promise<JudgeGame> {
    if (!loaded.value) await load()
    const now = Date.now()
    const copy: JudgeGame = {
      ...clone(game),
      id: newId(),
      createdAt: now,
      updatedAt: now,
      name: '',
      note: '',
      seq: nextSeq(games.value, now),
      events: [],
    }
    await save(copy)
    current.value = copy
    return copy
  }

  /** Imported games keep their data; an id already here gets a fresh one (kept as a copy). */
  async function importGames(list: JudgeGame[]): Promise<JudgeGame[]> {
    if (!loaded.value) await load()
    const taken = new Set(games.value.map((g) => g.id))
    const incoming = list.map((g) => (taken.has(g.id) ? { ...g, id: newId() } : g))
    await (await repository()).putMany(clone(incoming))
    await load()
    return incoming
  }

  return {
    games,
    loaded,
    current,
    derived,
    load,
    create,
    open,
    apply,
    undo,
    end,
    rename,
    setNote,
    remove,
    duplicate,
    importGames,
  }
})
