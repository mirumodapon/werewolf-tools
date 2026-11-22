/**
 * Versioned localStorage values. Each value is stored as `{ version, data }`; older
 * versions are upgraded with `migrations[v]` (v → v + 1) and written back. Reads never
 * throw (unusable data gives the fallback); failed writes are reported, not thrown.
 */
import { STORAGE_ROOT } from './keys.ts'

export interface Envelope<T> {
  version: number
  data: T
}

export type Migration = (data: unknown) => unknown

export interface StoreSpec<T> {
  /** Full key, from `storageKey()` or `globalKey()`. */
  key: string
  version: number
  migrations?: Record<number, Migration>
  /** Validates migrated data; throwing means unusable. */
  parse: (data: unknown) => T
  fallback: () => T
}

export type StorageErrorKind = 'quota' | 'unavailable' | 'corrupt' | 'unknown'

export interface StorageError {
  kind: StorageErrorKind
  key: string
  message: string
}

type ErrorListener = (error: StorageError) => void
const errorListeners = new Set<ErrorListener>()

export function onStorageError(listener: ErrorListener): () => void {
  errorListeners.add(listener)
  return () => errorListeners.delete(listener)
}

function report(error: StorageError): void {
  if (errorListeners.size === 0) console.warn('[storage]', error)
  for (const listener of errorListeners) listener(error)
}

function local(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

/** Runs the migrations from the envelope's version up to the spec's. */
export function migrate(
  spec: Pick<StoreSpec<unknown>, 'version' | 'migrations'>,
  envelope: Envelope<unknown>,
): unknown {
  let { version, data } = envelope
  if (version > spec.version) throw new Error(`version ${version} is newer than ${spec.version}`)
  for (; version < spec.version; version++) {
    const step = spec.migrations?.[version]
    if (!step) throw new Error(`no migration from version ${version}`)
    data = step(data)
  }
  return data
}

function isEnvelope(value: unknown): value is Envelope<unknown> {
  return typeof value === 'object' && value !== null && 'version' in value && 'data' in value
}

export function readStore<T>(spec: StoreSpec<T>): T {
  const storage = local()
  if (!storage) return spec.fallback()
  let raw: string | null
  try {
    raw = storage.getItem(spec.key)
  } catch (e) {
    report({ kind: 'unavailable', key: spec.key, message: message(e) })
    return spec.fallback()
  }
  if (raw === null) return spec.fallback()
  try {
    const envelope: unknown = JSON.parse(raw)
    if (!isEnvelope(envelope)) throw new Error('not a { version, data } envelope')
    const data = spec.parse(migrate(spec, envelope))
    if (envelope.version !== spec.version) writeStore(spec, data)
    return data
  } catch (e) {
    report({ kind: 'corrupt', key: spec.key, message: message(e) })
    return spec.fallback()
  }
}

function isQuotaError(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22)
  )
}

/** Returns false (and reports why) when the value could not be written. */
export function writeStore<T>(spec: StoreSpec<T>, data: T): boolean {
  const storage = local()
  if (!storage) {
    report({ kind: 'unavailable', key: spec.key, message: 'localStorage is unavailable' })
    return false
  }
  try {
    storage.setItem(spec.key, JSON.stringify({ version: spec.version, data }))
    return true
  } catch (e) {
    const quota = isQuotaError(e)
    report({
      kind: quota ? 'quota' : 'unknown',
      key: spec.key,
      message: quota ? 'storage quota exceeded' : message(e),
    })
    return false
  }
}

export function removeStore(key: string): void {
  try {
    local()?.removeItem(key)
  } catch {
    // Nothing to remove when storage is unavailable.
  }
}

export function keysWithPrefix(prefix: string): string[] {
  const storage = local()
  if (!storage) return []
  const keys: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key?.startsWith(prefix)) keys.push(key)
  }
  return keys
}

/** Removes every key of one scope; other scopes stay. */
export function clearNamespace(scope: string): void {
  for (const key of keysWithPrefix(`${STORAGE_ROOT}:${scope}:`)) removeStore(key)
}

/**
 * Calls `onChange` when another tab or app changes `key`. (The `storage` event never fires
 * in the window that made the change.)
 */
export function onStoreChange(key: string, onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const listener = (e: StorageEvent) => {
    if (e.key === key || e.key === null) onChange()
  }
  window.addEventListener('storage', listener)
  return () => window.removeEventListener('storage', listener)
}

/**
 * Deletes everything the tools store on this device: every `werewolf:*` key (local and
 * session storage) and the given IndexedDB databases, plus any other `werewolf-*`
 * database the browser lists. Other sites' data is untouched. Open connections delay a
 * database's deletion until the page reloads, which the caller should do next.
 */
export async function clearAllData(databases: readonly string[]): Promise<void> {
  for (const key of keysWithPrefix(`${STORAGE_ROOT}:`)) removeStore(key)
  try {
    for (const key of Object.keys(sessionStorage))
      if (key.startsWith(`${STORAGE_ROOT}:`)) sessionStorage.removeItem(key)
  } catch {
    // No session storage: nothing to clear there.
  }
  if (typeof indexedDB === 'undefined') return
  const names = new Set(databases)
  try {
    for (const db of (await indexedDB.databases?.()) ?? [])
      if (db.name?.startsWith(`${STORAGE_ROOT}-`)) names.add(db.name)
  } catch {
    // Older browsers cannot list databases: the known names are enough.
  }
  await Promise.all(
    [...names].map(
      (name) =>
        new Promise<void>((resolve) => {
          const request = indexedDB.deleteDatabase(name)
          request.onsuccess = request.onerror = request.onblocked = () => resolve()
        }),
    ),
  )
}
