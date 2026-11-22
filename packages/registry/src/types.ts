/** Tokyo Night accent of a tool's icon. */
export type AccentName = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'cyan' | 'blue' | 'purple'

/**
 * `alpha`: usable, still changing; `beta`: feature-complete; `rc`: release candidate;
 * `coming-soon`: listed on home, not built.
 */
export type ToolStatus = 'stable' | 'rc' | 'beta' | 'alpha' | 'coming-soon'

/** `pwa`: an installable app with its own service worker; `docs`: the documentation site. */
export type ToolKind = 'pwa' | 'docs'

export type Locale = 'zh-TW' | 'en-US'
export type Localized = Record<Locale, string>

export interface ToolMeta {
  /** Also the folder (`apps/<id>`) and the storage scope. */
  id: string
  kind: ToolKind
  name: Localized
  /** Manifest `short_name`. */
  shortName: Localized
  description: Localized
  /** `/` for home, `/<id>/` for everything else. */
  path: `/${string}`
  /** Tabler icon without the prefix, e.g. `cards`. */
  icon: string
  accent: AccentName
  status: ToolStatus
}
