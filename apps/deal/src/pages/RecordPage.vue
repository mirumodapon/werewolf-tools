<script setup lang="ts">
import { RoleChips, RulesSummary, useBoardText } from '@werewolf/boards'
import { playerCount } from '@werewolf/rules'
import { AppShell, IconButton, useConfirm } from '@werewolf/ui'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import JudgeLink from '../components/JudgeLink.vue'
import TableReveal from '../components/TableReveal.vue'
import type { DealRecord } from '../history/records.ts'
import { useFlowStore } from '../stores/flow.ts'
import { useHistoryStore } from '../stores/history.ts'

/** One saved deal: hold to see every seat, replay it, or hand it to the moderator. */
const props = defineProps<{ id: string }>()
const { t, boardName, formatDate } = useBoardText()
const router = useRouter()
const history = useHistoryStore()
const flow = useFlowStore()
const confirm = useConfirm()
const record = ref<DealRecord | null | undefined>(undefined)
onMounted(async () => (record.value = (await history.get(props.id)) ?? null))

function replay() {
  if (!record.value) return
  flow.start(record.value, 'replay')
  void router.push('/deal')
}

async function remove() {
  if (!record.value) return
  if (
    !(await confirm({
      message: t('history.deleteConfirm'),
      confirmLabel: t('common.delete'),
      danger: true,
    }))
  )
    return
  await history.remove(record.value.id)
  void router.replace('/history')
}
</script>

<template>
  <AppShell
    :title="record ? boardName(record.boardName) : t('history.title')"
    :back-label="t('common.back')"
    @back="router.push('/history')"
  >
    <template v-if="record" #actions>
      <IconButton icon="i-tabler-trash" :label="t('common.delete')" @click="remove" />
    </template>
    <p v-if="record === null" class="py-8 text-center text-comment">{{ t('history.notFound') }}</p>
    <template v-else-if="record">
      <p class="text-sm text-comment">
        {{ formatDate(record.createdAt) }} ·
        {{ t('common.players', { n: playerCount(record.roles) }) }}
      </p>
      <RoleChips :roles="record.roles" />
      <RulesSummary :rules="record.rules" />
      <TableReveal :table="record.assignments" />
      <div class="mt-auto flex flex-col gap-2">
        <JudgeLink :record="record" />
        <button type="button" class="h-12 rounded-xl bg-purple font-bold text-bg" @click="replay">
          <span class="i-tabler-repeat mr-1 size-5" aria-hidden="true" />{{ t('history.replay') }}
        </button>
      </div>
    </template>
  </AppShell>
</template>
