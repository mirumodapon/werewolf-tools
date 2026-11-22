/** `navigator.storage` helpers; every function is safe where the API is missing. */

export async function requestPersistentStorage(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null
    return (await navigator.storage.persisted()) || (await navigator.storage.persist())
  } catch {
    return null
  }
}

export interface StorageInfo {
  usage: number | null
  quota: number | null
  persisted: boolean | null
}

export async function getStorageInfo(): Promise<StorageInfo> {
  try {
    const [estimate, persisted] = await Promise.all([
      navigator.storage?.estimate?.(),
      navigator.storage?.persisted?.() ?? null,
    ])
    return { usage: estimate?.usage ?? null, quota: estimate?.quota ?? null, persisted }
  } catch {
    return { usage: null, quota: null, persisted: null }
  }
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return unit === 0 ? `${bytes} B` : `${value.toFixed(1)} ${units[unit]}`
}
