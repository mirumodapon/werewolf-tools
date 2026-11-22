import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import {
  appDatabaseName,
  clearNamespace,
  formatBytes,
  globalKey,
  keysWithPrefix,
  onStorageError,
  onStoreChange,
  readStore,
  storageKey,
  writeStore,
  type StorageError,
  type StoreSpec,
} from './index.ts'

interface Value {
  count: number
  label: string
}

const spec: StoreSpec<Value> = {
  key: 'werewolf:demo:value',
  version: 2,
  migrations: { 1: (d) => ({ count: (d as { n: number }).n, label: 'migrated' }) },
  parse: (d) => {
    if (typeof (d as Value).count !== 'number') throw new Error('bad')
    return d as Value
  },
  fallback: () => ({ count: 0, label: 'default' }),
}

describe('keys', () => {
  it('namespaces by scope', () => {
    expect(storageKey('judge', 'x')).toBe('werewolf:judge:x')
    expect(globalKey('theme')).toBe('werewolf:global:theme')
    expect(appDatabaseName('judge')).toBe('werewolf-judge')
  })
})

describe('store', () => {
  beforeEach(() => localStorage.clear())

  it('falls back when nothing is stored', () => {
    expect(readStore(spec)).toEqual({ count: 0, label: 'default' })
  })

  it('round-trips an envelope', () => {
    writeStore(spec, { count: 3, label: 'a' })
    expect(JSON.parse(localStorage.getItem(spec.key)!)).toEqual({
      version: 2,
      data: { count: 3, label: 'a' },
    })
    expect(readStore(spec)).toEqual({ count: 3, label: 'a' })
  })

  it('migrates and writes back old versions', () => {
    localStorage.setItem(spec.key, JSON.stringify({ version: 1, data: { n: 7 } }))
    expect(readStore(spec)).toEqual({ count: 7, label: 'migrated' })
    expect(JSON.parse(localStorage.getItem(spec.key)!).version).toBe(2)
  })

  it('reports corrupt data and falls back', () => {
    const seen = vi.fn<(e: StorageError) => void>()
    const off = onStorageError(seen)
    localStorage.setItem(spec.key, '{nope')
    expect(readStore(spec).label).toBe('default')
    expect(seen).toHaveBeenCalledWith(expect.objectContaining({ kind: 'corrupt' }))
    off()
  })

  it('reports a full quota instead of throwing', () => {
    const seen = vi.fn<(e: StorageError) => void>()
    const off = onStorageError(seen)
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(writeStore(spec, { count: 1, label: 'x' })).toBe(false)
    expect(seen).toHaveBeenCalledWith(expect.objectContaining({ kind: 'quota' }))
    spy.mockRestore()
    off()
  })

  it('clears one scope only', () => {
    localStorage.setItem('other', '1')
    localStorage.setItem('werewolf:global:theme', '{}')
    writeStore(spec, { count: 1, label: 'x' })
    clearNamespace('demo')
    expect(keysWithPrefix('werewolf:')).toEqual(['werewolf:global:theme'])
    expect(localStorage.getItem('other')).toBe('1')
  })

  it('hears changes made elsewhere', () => {
    const seen: string[] = []
    const off = onStoreChange('werewolf:global:theme', () => seen.push('theme'))
    window.dispatchEvent(new StorageEvent('storage', { key: 'werewolf:global:theme' }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'werewolf:judge:x' }))
    off()
    window.dispatchEvent(new StorageEvent('storage', { key: 'werewolf:global:theme' }))
    expect(seen).toEqual(['theme'])
  })
})

describe('formatBytes', () => {
  it('picks a unit', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(5 * 1024 ** 2)).toBe('5.0 MB')
  })
})
