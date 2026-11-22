import { MAX_PLAYERS, MIN_PLAYERS } from '@werewolf/rules'
import { readStore, storageKey, writeStore, type StoreSpec } from '@werewolf/storage'
import { defineStore } from 'pinia'
import { reactive, toRefs, watch } from 'vue'
import { z } from 'zod'

/** The last setup, offered again for the next game. */
export interface JudgeSettings {
  playerCount: number
  boardId: string | null
  /** Seat table drawer starts open. */
  showTable: boolean
}

export const DEFAULT_SETTINGS: JudgeSettings = { playerCount: 12, boardId: null, showTable: false }

const schema = z.object({
  playerCount: z
    .number()
    .int()
    .min(MIN_PLAYERS)
    .max(MAX_PLAYERS)
    .catch(DEFAULT_SETTINGS.playerCount),
  boardId: z.string().nullable().catch(null),
  showTable: z.boolean().catch(false),
})

export const SETTINGS_STORE: StoreSpec<JudgeSettings> = {
  key: storageKey('judge', 'settings'),
  version: 1,
  parse: (data) => schema.parse({ ...DEFAULT_SETTINGS, ...(data as object) }),
  fallback: () => ({ ...DEFAULT_SETTINGS }),
}

export const useSettingsStore = defineStore('settings', () => {
  const state = reactive<JudgeSettings>(readStore(SETTINGS_STORE))
  watch(state, (s) => writeStore(SETTINGS_STORE, { ...s }), { deep: true })
  return toRefs(state)
})
