import { secureRandomInt } from '@werewolf/storage'

/** 順時針 / 逆時針. */
export type Direction = 'cw' | 'ccw'

export interface SpeakerDraw {
  seat: number
  direction?: Direction
}

/** A random seat in 1..playerCount, and a direction when asked. */
export function drawSpeaker(
  playerCount: number,
  withDirection: boolean,
  randomInt: (max: number) => number = secureRandomInt,
): SpeakerDraw {
  if (!Number.isInteger(playerCount) || playerCount < 1)
    throw new RangeError(`players: ${playerCount}`)
  const seat = randomInt(playerCount) + 1
  return withDirection ? { seat, direction: randomInt(2) === 0 ? 'cw' : 'ccw' } : { seat }
}
