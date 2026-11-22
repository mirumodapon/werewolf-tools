/**
 * Whether this tool was opened from the home app. Home marks it in sessionStorage, which
 * survives navigation inside the same window: inside home's installed PWA a tool's title
 * leads back home. A tool installed on its own starts a fresh session without the mark.
 */
export const LAUNCHER_KEY = 'werewolf:launcher'

export function markLaunchedFromHome(): void {
  try {
    sessionStorage.setItem(LAUNCHER_KEY, 'home')
  } catch {
    // Private mode without storage: the title just stays plain text.
  }
}

export function launchedFromHome(): boolean {
  try {
    return sessionStorage.getItem(LAUNCHER_KEY) === 'home'
  } catch {
    return false
  }
}
