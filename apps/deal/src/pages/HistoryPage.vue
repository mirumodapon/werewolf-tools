<script setup lang="ts">
import { useBoardText } from '@werewolf/boards'
import { playerCount } from '@werewolf/rules'
import { AppShell } from '@werewolf/ui'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MAX_RECORDS, type DealRecord } from '../history/records.ts'
import { useFlowStore } from '../stores/flow.ts'
import { useHistoryStore } from '../stores/history.ts'

const { t, boardName, formatDate } = useBoardText()
const router = useRouter()
const history = useHistoryStore()
const flow = useFlowStore()
onMounted(() => history.load())

function replay(r: DealRecord) {
  flow.start(r, 'replay')
  void router.push('/deal')
}
</script>

<template>
  <AppShell :title="t('history.title')" :back-label="t('common.back')" @back="router.push('/')">
    <p class="text-sm text-comment">{{ t('history.keep', { n: MAX_RECORDS }) }}</p>
    <p v-if="history.loaded && !history.records.length" class="py-8 text-center text-comment">
      {{ t('history.empty') }}
    </p>
    <ul class="flex flex-col gap-2">
      <li
        v-for="r in history.records"
        :key="r.id"
        class="flex items-center gap-3 rounded-xl border border-border p-3"
        data-testid="record"
      >
        <div class="flex min-w-0 flex-1 flex-col">
          <span class="truncate font-bold">{{ boardName(r.boardName) }}</span>
          <span class="text-sm text-comment"
            >{{ formatDate(r.createdAt) }} ·
            {{ t('common.players', { n: playerCount(r.roles) }) }}</span
          >
        </div>
        <RouterLink :to="`/history/${r.id}`" class="rounded-lg bg-surface px-3 py-2 text-sm">{{
          t('history.view')
        }}</RouterLink>
        <button type="button" class="rounded-lg bg-surface px-3 py-2 text-sm" @click="replay(r)">
          {{ t('history.replay') }}
        </button>
      </li>
    </ul>
  </AppShell>
</template>
