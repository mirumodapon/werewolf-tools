import { cleanCounts, expandRoles, type Board } from '@werewolf/rules'
import { newId } from '@werewolf/storage'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  flowReducer,
  IDLE,
  isDealing,
  type Flow,
  type FlowAction,
  type FlowMode,
} from '../flow/deal.ts'
import { dealRoles } from '../flow/shuffle.ts'
import type { DealRecord } from '../history/records.ts'

/** Shuffles a board onto seats 1..n: the record to save. */
export function createDeal(
  board: Board,
  randomInt?: (max: number) => number,
  now = Date.now(),
): DealRecord {
  return {
    id: newId(),
    createdAt: now,
    boardId: board.id,
    boardName: board.name,
    roles: cleanCounts(board.roles),
    rules: { ...board.rules },
    assignments: dealRoles(expandRoles(board.roles), randomInt),
  }
}

/** Passing the phone round, for a new deal or a replay. */
export const useFlowStore = defineStore('flow', () => {
  const flow = ref<Flow>(IDLE)
  /** Kept after `done` for the moderator view. */
  const record = ref<DealRecord | null>(null)
  const dealing = computed(() => isDealing(flow.value))

  const dispatch = (action: FlowAction) => (flow.value = flowReducer(flow.value, action))

  function start(r: DealRecord, mode: FlowMode) {
    record.value = r
    dispatch({ type: 'start', mode, recordId: r.id, table: r.assignments })
  }

  function reset() {
    dispatch({ type: 'reset' })
    record.value = null
  }

  return { flow, record, dealing, dispatch, start, reset }
})
