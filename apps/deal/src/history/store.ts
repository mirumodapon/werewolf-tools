/**
 * Deal history: IndexedDB (`werewolf-deal`) when it opens, else localStorage
 * (`werewolf:deal:records`). The app uses the functions at the bottom.
 */
import {
  appDatabaseName,
  readStore,
  storageKey,
  writeStore,
  type StoreSpec,
} from '@werewolf/storage'
import { Dexie, type Table } from 'dexie'
import {
  MAX_RECORDS,
  newestFirst,
  normalizeRecord,
  readRecords,
  recordsToPrune,
  type DealRecord,
} from './records.ts'

export interface RecordStore {
  save(record: DealRecord): Promise<void>
  list(): Promise<DealRecord[]>
  get(id: string): Promise<DealRecord | undefined>
  delete(id: string): Promise<void>
  /** Keeps the newest `limit`; returns how many were deleted. */
  prune(limit: number): Promise<number>
}

export const DB_NAME = appDatabaseName('deal')

class DealDB extends Dexie {
  records!: Table<DealRecord, string>
  constructor(name: string) {
    super(name)
    this.version(1).stores({ records: 'id, createdAt' })
  }
}

export async function openIndexedDbStore(name = DB_NAME): Promise<RecordStore> {
  const db = new DealDB(name)
  await db.open()
  return {
    save: async (r) => void (await db.records.put(structuredClone(r))),
    list: async () => newestFirst(readRecords(await db.records.toArray())),
    get: async (id) => normalizeRecord(await db.records.get(id)) ?? undefined,
    delete: (id) => db.records.delete(id),
    prune: async (limit) => {
      const ids = recordsToPrune(await db.records.toArray(), limit)
      await db.records.bulkDelete(ids)
      return ids.length
    },
  }
}

export const RECORDS_STORE: StoreSpec<DealRecord[]> = {
  key: storageKey('deal', 'records'),
  version: 1,
  parse: (data) => (Array.isArray(data) ? readRecords(data) : []),
  fallback: () => [],
}

export function createLocalStore(): RecordStore {
  const all = () => readStore(RECORDS_STORE)
  const put = (records: DealRecord[]) => {
    if (!writeStore(RECORDS_STORE, records)) throw new Error('cannot write the deal history')
  }
  return {
    save: async (r) => put([...all().filter((x) => x.id !== r.id), r]),
    list: async () => newestFirst(all()),
    get: async (id) => all().find((r) => r.id === id),
    delete: async (id) => put(all().filter((r) => r.id !== id)),
    prune: async (limit) => {
      const ids = new Set(recordsToPrune(all(), limit))
      if (ids.size) put(all().filter((r) => !ids.has(r.id)))
      return ids.size
    },
  }
}

export async function openRecordStore(): Promise<RecordStore> {
  try {
    if (typeof indexedDB === 'undefined') throw new Error('no IndexedDB')
    return await openIndexedDbStore()
  } catch {
    return createLocalStore()
  }
}

let current: Promise<RecordStore> | null = null
const store = () => (current ??= openRecordStore())

/** Tests swap the backing store. */
export function setRecordStore(next: RecordStore | null): void {
  current = next ? Promise.resolve(next) : null
}

export const listRecords = async () => (await store()).list()
export const getRecord = async (id: string) => (await store()).get(id)
export const deleteRecord = async (id: string) => (await store()).delete(id)

/** Saves a deal and drops the oldest beyond MAX_RECORDS. */
export async function saveAndPrune(record: DealRecord, limit = MAX_RECORDS): Promise<void> {
  const s = await store()
  await s.save(record)
  await s.prune(limit)
}
