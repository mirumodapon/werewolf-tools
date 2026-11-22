import {
  DEFAULT_VISION_MODE,
  MAX_PLAYERS,
  MIN_PLAYERS,
  VISION_MODES,
  type VisionMode,
} from '@werewolf/rules'
import { readStore, storageKey, writeStore, type StoreSpec } from '@werewolf/storage'
import { defineStore } from 'pinia'
import { reactive, toRefs, watch } from 'vue'
import { z } from 'zod'

/** Remembered so the next game starts from the last setup. */
export interface DealSettings {
  playerCount: number
  boardId: string | null
  visionMode: VisionMode
  speakerWithDirection: boolean
}

export const DEFAULT_SETTINGS: DealSettings = {
  playerCount: 12,
  boardId: null,
  visionMode: DEFAULT_VISION_MODE,
  speakerWithDirection: true,
}

const schema = z.object({
  playerCount: z
    .number()
    .int()
    .min(MIN_PLAYERS)
    .max(MAX_PLAYERS)
    .catch(DEFAULT_SETTINGS.playerCount),
  boardId: z.string().nullable().catch(null),
  visionMode: z.enum(VISION_MODES).catch(DEFAULT_SETTINGS.visionMode),
  speakerWithDirection: z.boolean().catch(DEFAULT_SETTINGS.speakerWithDirection),
})

export const SETTINGS_STORE: StoreSpec<DealSettings> = {
  key: storageKey('deal', 'settings'),
  version: 1,
  parse: (data) => schema.parse({ ...DEFAULT_SETTINGS, ...(data as object) }),
  fallback: () => ({ ...DEFAULT_SETTINGS }),
}

export const useSettingsStore = defineStore('settings', () => {
  const state = reactive<DealSettings>(readStore(SETTINGS_STORE))
  watch(state, (s) => writeStore(SETTINGS_STORE, { ...s }), { deep: true })
  return toRefs(state)
})
