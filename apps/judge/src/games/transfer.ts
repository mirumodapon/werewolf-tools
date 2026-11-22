import { ShareError } from '@werewolf/share'
import { decodeGameLink, encodeGameLink } from './link.ts'
import { parseGame, type JudgeGame } from './game.ts'

/** `/judge/?s=<payload>`: a whole game in a link (compact format, see link.ts). */
export const GAME_PARAM = 's'

export const encodeGame = (game: JudgeGame): Promise<string> => encodeGameLink(game)

export async function decodeGame(payload: string): Promise<JudgeGame> {
  try {
    return await decodeGameLink(payload)
  } catch (e) {
    throw e instanceof ShareError ? e : new ShareError('not a game')
  }
}

/** JSON backup: one game or an array of them. */
export function exportJson(games: JudgeGame | readonly JudgeGame[]): string {
  return `${JSON.stringify(games, null, 2)}\n`
}

export class ImportError extends Error {
  override name = 'ImportError'
}

/** Every game in a backup file; throws ImportError naming the first bad entry. */
export function parseBackup(text: string): JudgeGame[] {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new ImportError('not JSON')
  }
  const list = Array.isArray(value) ? value : [value]
  return list.map((entry, i) => {
    const game = parseGame(entry)
    if (!game) throw new ImportError(`entry ${i + 1} is not a game`)
    return game
  })
}

/** A file name from the game's name, without characters file systems refuse. */
export function fileName(name: string): string {
  return `${name.replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '') || 'game'}.json`
}
