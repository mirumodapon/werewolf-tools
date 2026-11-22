import type { Plugin } from 'vite-plus'
import { packageOf, readPackage, renderNotices, type PackageNotice } from './licenses.ts'

/** Served next to each app's index.html. */
export const LICENSES_FILE = 'licenses.txt'

/**
 * Emits LICENSES_FILE for the client bundle and fails the build when a bundled package's
 * license is not allowed.
 */
export function thirdPartyLicensesPlugin(title: string): Plugin {
  return {
    name: 'werewolf:third-party-licenses',
    apply: 'build',
    // Only what reaches the browser (not VitePress's SSR build).
    applyToEnvironment: (env) => env.config.consumer === 'client',
    generateBundle(_options, bundle) {
      const dirs = new Set<string>()
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue
        for (const id of output.moduleIds) {
          const pkg = packageOf(id)
          if (pkg) dirs.add(pkg.dir)
        }
      }
      const byVersion = new Map<string, PackageNotice>()
      for (const dir of dirs) {
        const notice = readPackage(dir)
        byVersion.set(`${notice.name}@${notice.version}`, notice)
      }
      const packages = [...byVersion.values()]
      const refused = packages.filter((p) => !p.license)
      if (refused.length) {
        this.error(
          `bundled packages with licenses that are not allowed: ${refused
            .map((p) => `${p.name}@${p.version} (${p.declared})`)
            .join(', ')}`,
        )
      }
      this.emitFile({
        type: 'asset',
        fileName: LICENSES_FILE,
        source: renderNotices(title, packages),
      })
    },
  }
}
