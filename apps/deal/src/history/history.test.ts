import { DEFAULT_RULES } from '@werewolf/rules'
import { beforeEach, describe, expect, it } from 'vite-plus/test'
import { MAX_RECORDS, normalizeRecord, recordsToPrune, type DealRecord } from './records.ts'
import {
  createLocalStore,
  listRecords,
  openIndexedDbStore,
  saveAndPrune,
  setRecordStore,
} from './store.ts'

const record = (i: number): DealRecord => ({
  id: `r${i}`,
  createdAt: i,
  boardId: null,
  boardName: 'x',
  roles: { werewolf: 1, seer: 1 },
  rules: DEFAULT_RULES,
  visionMode: 'seats',
  assignments: [
    { seat: 1, role: 'werewolf' },
    { seat: 2, role: 'seer' },
  ],
})

describe('records', () => {
  it('prunes beyond the newest 10', () => {
    const list = Array.from({ length: 12 }, (_, i) => record(i))
    expect(recordsToPrune(list)).toEqual(['r1', 'r0'])
    expect(recordsToPrune(list.slice(0, MAX_RECORDS))).toEqual([])
  })

  it('reads old records without rules and refuses broken ones', () => {
    const { rules: _, ...old } = record(1)
    expect(normalizeRecord(old)?.rules).toEqual(DEFAULT_RULES)
    expect(normalizeRecord({ id: 'x' })).toBeNull()
  })
})

describe('stores', () => {
  beforeEach(() => localStorage.clear())

  for (const [name, open] of [
    ['IndexedDB', () => openIndexedDbStore(`test-${Math.random()}`)],
    ['localStorage', async () => createLocalStore()],
  ] as const) {
    it(`keeps the newest 10 in ${name}`, async () => {
      setRecordStore(await open())
      for (let i = 0; i < 12; i++) await saveAndPrune(record(i))
      const list = await listRecords()
      expect(list).toHaveLength(10)
      expect(list[0]?.id).toBe('r11')
      setRecordStore(null)
    })
  }
})
