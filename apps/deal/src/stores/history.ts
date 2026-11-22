import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DealRecord } from '../history/records.ts'
import { deleteRecord, getRecord, listRecords, saveAndPrune } from '../history/store.ts'

/** The last 10 deals, newest first. */
export const useHistoryStore = defineStore('history', () => {
  const records = ref<DealRecord[]>([])
  const loaded = ref(false)

  async function load() {
    records.value = await listRecords()
    loaded.value = true
  }

  async function add(record: DealRecord) {
    await saveAndPrune(record)
    await load()
  }

  async function remove(id: string) {
    await deleteRecord(id)
    await load()
  }

  const get = async (id: string) => records.value.find((r) => r.id === id) ?? (await getRecord(id))

  return { records, loaded, load, add, remove, get }
})
