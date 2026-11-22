<script setup lang="ts">
import { RoleChips, RulesSummary, UnverifiedBadge } from '@werewolf/boards'
import { AppShell, IconButton, useConfirm } from '@werewolf/ui'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdvancedOptions from '../components/AdvancedOptions.vue'
import ExportSheet from '../components/ExportSheet.vue'
import SeatTable from '../components/SeatTable.vue'
import Timeline from '../components/Timeline.vue'
import { isVerified } from '../games/game.ts'
import { useGamesStore } from '../stores/games.ts'
import { useJudgeText } from '../useJudgeText.ts'

/** A saved game: result, seats, timeline; rename, note, export (text, JSON, image, link), copy, delete. */
const props = defineProps<{ id: string }>()
const { t, gameName, boardName, formatDate } = useJudgeText()
const router = useRouter()
const store = useGamesStore()
const confirm = useConfirm()
const missing = ref(false)
const exportOpen = ref(false)

onMounted(async () => {
  if (!(await store.open(props.id))) missing.value = true
})
const game = computed(() => store.current)
const state = computed(() => store.derived?.state)
const name = computed({
  get: () => game.value?.name ?? '',
  set: (v: string) => void store.rename(v),
})
const note = computed({
  get: () => game.value?.note ?? '',
  set: (v: string) => void store.setNote(v),
})

async function duplicate() {
  if (!game.value) return
  const copy = await store.duplicate(game.value)
  await router.push(`/play/${copy.id}`)
}

async function remove() {
  if (!game.value) return
  if (
    !(await confirm({
      message: t('detail.deleteConfirm'),
      confirmLabel: t('common.delete'),
      danger: true,
    }))
  )
    return
  await store.remove(game.value.id)
  await router.replace('/')
}
</script>

<template>
  <AppShell
    :title="game ? gameName(game) : t('detail.title')"
    :back-label="t('common.back')"
    @back="router.push('/')"
  >
    <template v-if="game" #actions>
      <IconButton
        icon="i-tabler-file-export"
        :label="t('export.title')"
        data-testid="export"
        @click="exportOpen = true"
      />
      <IconButton icon="i-tabler-trash" :label="t('common.delete')" @click="remove" />
    </template>
    <p v-if="missing" class="py-8 text-center text-comment">{{ t('detail.notFound') }}</p>
    <template v-else-if="game && state">
      <section class="flex flex-col gap-1 rounded-xl border border-border p-3">
        <p class="text-sm text-comment">{{ formatDate(game.createdAt) }}</p>
        <p
          class="text-xl font-bold"
          :class="state.winner ? 'text-green' : 'text-cyan'"
          data-testid="result"
        >
          {{ state.winner ? t(`winners.${state.winner}`) : t('detail.ongoing') }}
        </p>
        <span class="flex items-center gap-2">
          <span class="flex-1 font-bold">{{ boardName(game.board.name) }}</span>
          <UnverifiedBadge v-if="!isVerified(game.board)" />
        </span>
        <RoleChips :roles="game.board.roles" />
        <RulesSummary :rules="game.board.rules" />
      </section>

      <RouterLink
        v-if="!state.winner"
        :to="`/play/${game.id}`"
        class="flex h-12 items-center justify-center gap-1 rounded-xl bg-purple font-bold text-bg"
      >
        <span class="i-tabler-player-play size-5" aria-hidden="true" />{{ t('detail.continue') }}
      </RouterLink>

      <label class="flex flex-col gap-1">
        <span class="text-sm text-subtle">{{ t('detail.name') }}</span>
        <input
          v-model.lazy="name"
          maxlength="40"
          :placeholder="gameName({ ...game, name: '' })"
          class="rounded-lg border border-border bg-bg px-3 py-2"
        />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-sm text-subtle">{{ t('detail.note') }}</span>
        <textarea
          v-model.lazy="note"
          rows="2"
          :placeholder="t('detail.notePlaceholder')"
          class="rounded-lg border border-border bg-bg px-3 py-2"
        />
      </label>

      <AdvancedOptions :model-value="game.options" :roles="game.board.roles" readonly />

      <h2 class="text-sm text-subtle">{{ t('seats.title') }}</h2>
      <SeatTable :state="state" />
      <h2 class="text-sm text-subtle">{{ t('detail.timeline') }}</h2>
      <Timeline :log="state.log" />

      <div class="flex flex-col gap-2">
        <button
          type="button"
          class="h-12 rounded-xl bg-surface font-bold"
          @click="exportOpen = true"
        >
          <span class="i-tabler-file-export mr-1 size-5" aria-hidden="true" />{{
            t('export.title')
          }}
        </button>
        <button type="button" class="h-12 rounded-xl bg-surface font-bold" @click="duplicate">
          <span class="i-tabler-copy mr-1 size-5" aria-hidden="true" />{{ t('detail.duplicate') }}
        </button>
      </div>
      <ExportSheet v-model:open="exportOpen" :game="game" />
    </template>
  </AppShell>
</template>
