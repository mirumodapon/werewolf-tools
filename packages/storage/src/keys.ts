/**
 * Storage namespaces. Every localStorage key is `werewolf:<scope>:<name>`, where scope is
 * `global` (shared by every tool: theme, language, custom boards) or an app id. Each app
 * owns one IndexedDB database, `werewolf-<appId>`.
 */
export const STORAGE_ROOT = 'werewolf'
export const GLOBAL_SCOPE = 'global'

export function storageKey(scope: string, name: string): string {
  return `${STORAGE_ROOT}:${scope}:${name}`
}

export function globalKey(name: string): string {
  return storageKey(GLOBAL_SCOPE, name)
}

export function appDatabaseName(appId: string): string {
  return `${STORAGE_ROOT}-${appId}`
}
