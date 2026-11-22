import {
  BUILTIN_BOARDS,
  cleanCounts,
  playerCount,
  type Board,
  type BoardRules,
  type RoleCounts,
} from '@werewolf/rules'
import { newId, onStoreChange, readStore, writeStore } from '@werewolf/storage'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { BOARDS_STORE, type CustomBoard } from './custom.ts'

export interface BoardInput {
  id?: string
  name: string
  roles: RoleCounts
  rules: BoardRules
  note?: string
}

/** Built-in boards plus this phone's custom ones (kept in step with other open tools). */
export const useBoardsStore = defineStore('boards', () => {
  const customs = ref<CustomBoard[]>(readStore(BOARDS_STORE))
  const persist = () => writeStore(BOARDS_STORE, customs.value)
  onStoreChange(BOARDS_STORE.key, () => (customs.value = readStore(BOARDS_STORE)))

  const all = computed<Board[]>(() => [...BUILTIN_BOARDS, ...customs.value])

  function byId(id: string | null | undefined): Board | undefined {
    return id ? all.value.find((b) => b.id === id) : undefined
  }

  /** Built-in first, then custom, for one player count. */
  function forCount(count: number): Board[] {
    return all.value.filter((b) => playerCount(b.roles) === count)
  }

  function save(input: BoardInput): string {
    const board: CustomBoard = {
      id: input.id ?? newId(),
      name: input.name.trim(),
      roles: cleanCounts(input.roles),
      rules: { ...input.rules },
      builtin: false,
      verified: false,
    }
    if (input.note?.trim()) board.note = input.note.trim()
    const i = customs.value.findIndex((b) => b.id === board.id)
    if (i === -1) customs.value.push(board)
    else customs.value[i] = board
    persist()
    return board.id
  }

  function remove(id: string) {
    customs.value = customs.value.filter((b) => b.id !== id)
    persist()
  }

  return { customs, all, byId, forCount, save, remove }
})
