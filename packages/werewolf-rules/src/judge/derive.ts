import { applyEvent, initialState, JudgeError, nextStep } from './engine.ts'
import type { GameEvent, GameState, JudgeSetup, Step } from './types.ts'

export interface DerivedGame {
  state: GameState
  step: Step | null
  /** The first input that no longer fits (a stored game edited by hand, or a rules change). */
  error: { index: number; message: string } | null
}

/** Replays every input from the start. Inputs after a bad one are ignored. */
export function deriveGame(setup: JudgeSetup, events: readonly GameEvent[]): DerivedGame {
  let state = initialState(setup)
  for (const [index, event] of events.entries()) {
    try {
      state = applyEvent(state, event)
    } catch (e) {
      if (!(e instanceof JudgeError)) throw e
      return { state, step: nextStep(state), error: { index, message: e.message } }
    }
  }
  return { state, step: nextStep(state), error: null }
}
