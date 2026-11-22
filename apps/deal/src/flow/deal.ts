import type { SeatRole } from '@werewolf/rules'

/** A fresh deal, or a saved one passed round again. */
export type FlowMode = 'deal' | 'replay'

/**
 * Pass the phone. Only the player looking has a role on screen; `handoff` and `done`
 * carry nothing the screen could show.
 */
export type Flow =
  | { step: 'idle' }
  | { step: 'handoff'; mode: FlowMode; recordId: string; table: SeatRole[]; index: number }
  | { step: 'reveal'; mode: FlowMode; recordId: string; table: SeatRole[]; index: number }
  | { step: 'done'; mode: FlowMode; recordId: string }

export type FlowAction =
  | { type: 'start'; mode: FlowMode; recordId: string; table: SeatRole[] }
  | { type: 'reveal' }
  /** Turned face down by the player (double tap): next player. */
  | { type: 'confirm' }
  /** Hidden without confirming (back key, app in the background): same player again. */
  | { type: 'hide' }
  | { type: 'reset' }

export const IDLE: Flow = { step: 'idle' }

export function flowReducer(flow: Flow, action: FlowAction): Flow {
  switch (action.type) {
    case 'start':
      return {
        step: 'handoff',
        mode: action.mode,
        recordId: action.recordId,
        table: action.table,
        index: 0,
      }
    case 'reveal':
      return flow.step === 'handoff' ? { ...flow, step: 'reveal' } : flow
    case 'confirm': {
      if (flow.step !== 'reveal') return flow
      const next = flow.index + 1
      return next < flow.table.length
        ? { ...flow, step: 'handoff', index: next }
        : { step: 'done', mode: flow.mode, recordId: flow.recordId }
    }
    case 'hide':
      return flow.step === 'reveal' ? { ...flow, step: 'handoff' } : flow
    case 'reset':
      return IDLE
  }
}

export function isDealing(flow: Flow): flow is Extract<Flow, { step: 'handoff' | 'reveal' }> {
  return flow.step === 'handoff' || flow.step === 'reveal'
}
