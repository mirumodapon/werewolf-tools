/** Longest the startup waits for the update check. */
export const CHECK_TIMEOUT_MS = 6000
/** Check again when the app returns after this long in the background. */
export const RESUME_CHECK_MS = 5 * 60 * 1000
/** Reload anyway if the new version has not taken over by then. */
export const UPDATE_RELOAD_MS = 10000

export type UpdateCheck = 'found' | 'latest' | 'unavailable'

/**
 * Asks the service worker for a new version right now. `found` means one is installing
 * or waiting: `<UpdateGate>` then applies it and reloads, as at startup. `unavailable`
 * when offline or without a service worker (the dev server).
 */
export async function checkForUpdate(nav: Navigator = navigator): Promise<UpdateCheck> {
  if (!('serviceWorker' in nav) || nav.onLine === false) return 'unavailable'
  try {
    const registration = await nav.serviceWorker.getRegistration()
    if (!registration) return 'unavailable'
    if (registration.waiting) return 'found'
    await registration.update()
    return registration.installing || registration.waiting ? 'found' : 'latest'
  } catch {
    return 'unavailable'
  }
}
