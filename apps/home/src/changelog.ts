/** The subset of Markdown CHANGELOG.md uses, as blocks to render. */
export type ChangelogBlock =
  | { kind: 'version'; text: string }
  | { kind: 'section'; text: string }
  | { kind: 'item'; text: string; depth: number }
  | { kind: 'text'; text: string }

/** Only the `limit` newest versions (`## ` headings); the `# ` title is dropped. */
export function parseChangelog(markdown: string, limit = 3): ChangelogBlock[] {
  const blocks: ChangelogBlock[] = []
  let versions = 0
  for (const line of markdown.split('\n')) {
    if (line.startsWith('## ')) {
      if (++versions > limit) break
      blocks.push({ kind: 'version', text: line.slice(3).trim() })
    } else if (!versions || line.startsWith('# ') || !line.trim()) {
      continue
    } else if (line.startsWith('### ')) {
      blocks.push({ kind: 'section', text: line.slice(4).trim() })
    } else {
      const item = /^(\s*)[-*] (.*)$/.exec(line)
      if (item)
        blocks.push({ kind: 'item', text: item[2]!.trim(), depth: Math.floor(item[1]!.length / 2) })
      else blocks.push({ kind: 'text', text: line.trim() })
    }
  }
  return blocks
}

/** Splits `code` spans out of a line. */
export function inlineParts(text: string): { code: boolean; text: string }[] {
  return text
    .split(/(`[^`]+`)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith('`') && part.endsWith('`')
        ? { code: true, text: part.slice(1, -1) }
        : { code: false, text: part },
    )
}
