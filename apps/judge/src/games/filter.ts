import { localized, type Locale, type Winner } from '@werewolf/rules'
import { winnerOf, type JudgeGame } from './game.ts'

export type ResultFilter = 'all' | 'ongoing' | Exclude<Winner, 'none'>

export interface GameFilter {
  text: string
  result: ResultFilter
}

/** Matches the name (typed or automatic), board name and note; then the result. */
export function filterGames(
  games: readonly JudgeGame[],
  filter: GameFilter,
  displayName: (g: JudgeGame) => string,
  locale: Locale,
): JudgeGame[] {
  const text = filter.text.trim().toLowerCase()
  return games.filter((g) => {
    if (text) {
      const haystack = [displayName(g), localized(g.board.name, locale), g.note]
        .join('\n')
        .toLowerCase()
      if (!haystack.includes(text)) return false
    }
    if (filter.result === 'all') return true
    const winner = winnerOf(g)
    return filter.result === 'ongoing' ? winner === null : winner === filter.result
  })
}
