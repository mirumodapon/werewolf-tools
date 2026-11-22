<script setup lang="ts">
import { useBoardText } from '@werewolf/boards'
import { playerCount } from '@werewolf/rules'
import { AppShell, useConfirm } from '@werewolf/ui'
import { computed, onMounted } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import CardBack from '../components/CardBack.vue'
import JudgeLink from '../components/JudgeLink.vue'
import RoleCard from '../components/RoleCard.vue'
import TableReveal from '../components/TableReveal.vue'
import { usePrivacyGuard } from '../flow/usePrivacyGuard.ts'
import { useFlowStore } from '../stores/flow.ts'

/** Hand-off → hold to reveal → double-tap to cover → next → done. */
const { t, boardName } = useBoardText()
const router = useRouter()
const store = useFlowStore()
const confirm = useConfirm()
const flow = computed(() => store.flow)
const record = computed(() => store.record)

onMounted(() => {
  if (flow.value.step === 'idle' || !record.value) void router.replace('/')
})

const current = computed(() =>
  flow.value.step === 'handoff' || flow.value.step === 'reveal'
    ? flow.value.table[flow.value.index]!
    : null,
)

usePrivacyGuard(
  () => flow.value.step === 'reveal',
  () => store.dispatch({ type: 'hide' }),
)

// After the privacy guard: a face-up card is turned over first.
onBeforeRouteLeave(async () => {
  if (!store.dealing) return true
  if (!(await confirm({ message: t('flow.abortConfirm'), danger: true }))) return false
  store.reset()
  return true
})

const isReplay = computed(() => flow.value.step !== 'idle' && flow.value.mode === 'replay')

function again() {
  store.reset()
  void router.push('/')
}

function speaker() {
  const n = record.value ? playerCount(record.value.roles) : undefined
  store.reset()
  void router.push({ path: '/', query: { tab: 'speaker', ...(n ? { n } : {}) } })
}

const leave = () => void router.push(isReplay.value ? '/history' : '/')
</script>

<template>
  <AppShell
    :title="record ? boardName(record.boardName) : t('app.title')"
    :back-label="t('common.back')"
    @back="leave"
  >
    <p v-if="isReplay" class="self-center rounded-full bg-surface px-3 py-1 text-sm text-cyan">
      <span class="i-tabler-repeat mr-1 size-4" aria-hidden="true" />{{ t('flow.replay') }}
    </p>

    <!-- The card sits in the middle of the screen; nothing on this page can be selected. -->
    <div
      v-if="current && (flow.step === 'handoff' || flow.step === 'reveal')"
      class="no-select flex flex-1 flex-col items-center justify-center gap-4"
      data-testid="card-stage"
    >
      <template v-if="flow.step === 'handoff'">
        <p class="text-center text-sm text-comment">
          {{ t('flow.progress', { i: flow.index + 1, n: flow.table.length }) }}
        </p>
        <p class="text-center text-2xl" data-testid="handoff">
          {{ t('flow.handoff') }}
          <strong class="text-purple">{{ t('flow.player', { n: current.seat }) }}</strong>
        </p>
        <CardBack
          :key="`back-${flow.index}`"
          :label="t('flow.holdToReveal')"
          @reveal="store.dispatch({ type: 'reveal' })"
        />
      </template>
      <RoleCard
        v-else
        :key="`card-${flow.index}`"
        :self="current"
        @cover="store.dispatch({ type: 'confirm' })"
      />
    </div>

    <template v-else-if="flow.step === 'done' && record">
      <p class="flex items-center justify-center gap-2 text-xl text-green">
        <span class="i-tabler-circle-check size-7" aria-hidden="true" />{{ t('flow.done') }}
      </p>
      <h2 class="text-sm text-subtle">{{ t('flow.judgeView') }}</h2>
      <TableReveal :table="record.assignments" />
      <div class="mt-auto flex flex-col gap-2">
        <JudgeLink :record="record" />
        <template v-if="!isReplay">
          <button type="button" class="h-12 rounded-xl bg-surface font-bold" @click="speaker">
            <span class="i-tabler-speakerphone mr-1 size-5" aria-hidden="true" />{{
              t('flow.drawSpeaker')
            }}
          </button>
          <button
            type="button"
            class="h-12 rounded-xl bg-purple font-bold text-bg"
            data-testid="again"
            @click="again"
          >
            <span class="i-tabler-cards mr-1 size-5" aria-hidden="true" />{{ t('flow.again') }}
          </button>
        </template>
        <button v-else type="button" class="h-12 rounded-xl bg-surface font-bold" @click="leave">
          {{ t('flow.backToHistory') }}
        </button>
      </div>
    </template>
  </AppShell>
</template>
