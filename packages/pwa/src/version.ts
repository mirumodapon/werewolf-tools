import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

/** The repo's one version (root package.json). */
export function repoVersion(): string {
  const file = new URL('../../../package.json', import.meta.url)
  return (JSON.parse(readFileSync(file, 'utf8')) as { version: string }).version
}

/** Short commit of the build; the CI SHA or `dev` outside git. */
export function gitRev(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev'
  }
}

/** `<version>-<rev>`, injected into every app as `__APP_VERSION__`. */
export const buildVersion = () => `${repoVersion()}-${gitRev()}`
