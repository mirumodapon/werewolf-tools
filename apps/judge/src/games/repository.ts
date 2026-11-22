/**
 * Saved games: IndexedDB (`werewolf-judge`), or localStorage (`werewolf:judge:games`)
 * when IndexedDB will not open. No limit on how many are kept.
 */
import {
  appDatabaseName,
  readStore,
  storageKey,
  writeStore,
  type StoreSpec,
} from '@werewolf/storage'
import { Dexie, type Table } from 'dexie'
import { parseGame, type JudgeGame } from './game.ts'

export interface GameRepository {
  list(): Promise<JudgeGame[]>
  get(id: string): Promise<JudgeGame | undefined>
  put(game: JudgeGame): Promise<void>
  putMany(games: JudgeGame[]): Promise<void>
  delete(id: string): Promise<void>
}

export const DB_NAME = appDatabaseName('judge')
const newestFirst = (games: JudgeGame[]) =>
  games.toSorted((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id))
const readAll = (rows: unknown[]) => rows.map(parseGame).filter((g): g is JudgeGame => g !== null)

class JudgeDB extends Dexie {
  games!: Table<JudgeGame, string>
  constructor(name: string) {
    super(name)
    this.version(1).stores({ games: 'id, createdAt, updatedAt' })
  }
}

export async function openIndexedDbRepository(name = DB_NAME): Promise<GameRepository> {
  const db = new JudgeDB(name)
  await db.open()
  return {
    list: async () => newestFirst(readAll(await db.games.toArray())),
    get: async (id) => parseGame(await db.games.get(id)) ?? undefined,
    put: async (g) => void (await db.games.put(structuredClone(g))),
    // One transaction: an import lands whole or not at all.
    putMany: async (games) => void (await db.games.bulkPut(structuredClone(games))),
    delete: (id) => db.games.delete(id),
  }
}

export const GAMES_STORE: StoreSpec<JudgeGame[]> = {
  key: storageKey('judge', 'games'),
  version: 1,
  parse: (data) => (Array.isArray(data) ? readAll(data) : []),
  fallback: () => [],
}

export function createLocalRepository(): GameRepository {
  const all = () => readStore(GAMES_STORE)
  const save = (games: JudgeGame[]) => {
    if (!writeStore(GAMES_STORE, games)) throw new Error('cannot save the games')
  }
  return {
    list: async () => newestFirst(all()),
    get: async (id) => all().find((g) => g.id === id),
    put: async (g) => save([...all().filter((x) => x.id !== g.id), g]),
    putMany: async (games) => {
      const ids = new Set(games.map((g) => g.id))
      save([...all().filter((x) => !ids.has(x.id)), ...games])
    },
    delete: async (id) => save(all().filter((g) => g.id !== id)),
  }
}

let current: Promise<GameRepository> | null = null

export function repository(): Promise<GameRepository> {
  return (current ??= (async () => {
    try {
      if (typeof indexedDB === 'undefined') throw new Error('no IndexedDB')
      return await openIndexedDbRepository()
    } catch {
      return createLocalRepository()
    }
  })())
}

/** Tests swap the backing store. */
export function setRepository(next: GameRepository | null): void {
  current = next ? Promise.resolve(next) : null
}
