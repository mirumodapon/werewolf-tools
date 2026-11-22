<script setup lang="ts">
import { RoleChips, RulesSummary, UnverifiedBadge } from '@werewolf/boards'
import { AppShell, BottomBar } from '@werewolf/ui'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdvancedOptions from '../components/AdvancedOptions.vue'
import SeatTable from '../components/SeatTable.vue'
import Timeline from '../components/Timeline.vue'
import { derive, isVerified, type JudgeGame } from '../games/game.ts'
import { decodeGame } from '../games/transfer.ts'
import { useGamesStore } from '../stores/games.ts'
import { useJudgeText } from '../useJudgeText.ts'

/**
 * A shared game (`?s=`): everything about it — result, board and settings, seats and what
 * happened each night and day — read-only, then saved on this device if wanted.
 */
const props = defineProps<{ payload?: string }>()
const { t, gameName, boardName, formatDate } = useJudgeText()
const router = useRouter()
const store = useGamesStore()
const game = ref<JudgeGame | null | undefined>(undefined)
onMounted(async () => {
  try {
    game.value = props.payload ? await decodeGame(props.payload) : null
  } catch {
    game.value = null
  }
})
const state = computed(() => (game.value ? derive(game.value).state : null))

async function save() {
  if (!game.value) return
  const [saved] = await store.importGames([game.value])
  await router.replace(`/games/${saved!.id}`)
}
</script>

<template>
  <AppShell :title="t('import.title')" :back-label="t('common.back')" @back="router.replace('/')">
    <p v-if="game === null" class="py-8 text-center text-red" role="alert">
      {{ t('import.invalid') }}
    </p>
    <template v-else-if="game && state">
      <p class="flex items-center gap-2 text-sm text-comment">
        <span class="i-tabler-share size-4" aria-hidden="true" />{{ t('import.shared') }}
      </p>

      <section
        class="flex flex-col gap-1 rounded-xl border border-border p-3"
        data-testid="shared-game"
      >
        <p class="text-lg font-bold">{{ gameName(game) }}</p>
        <p class="text-sm text-comment">{{ formatDate(game.createdAt) }}</p>
        <p
          class="text-xl font-bold"
          :class="state.winner ? 'text-green' : 'text-cyan'"
          data-testid="shared-result"
        >
          {{ state.winner ? t(`winners.${state.winner}`) : t('detail.ongoing') }}
        </p>
        <span class="flex items-center gap-2">
          <span class="flex-1 font-bold">{{ boardName(game.board.name) }}</span>
          <span class="text-sm text-comment">{{
            t('common.players', { n: state.players.length })
          }}</span>
          <UnverifiedBadge v-if="!isVerified(game.board)" />
        </span>
        <RoleChips :roles="game.board.roles" />
        <RulesSummary :rules="game.board.rules" />
        <p v-if="game.note" class="mt-1 text-sm">{{ t('detail.note') }}：{{ game.note }}</p>
      </section>

      <AdvancedOptions :model-value="game.options" :roles="game.board.roles" readonly />

      <h2 class="text-sm text-subtle">{{ t('seats.title') }}</h2>
      <SeatTable :state="state" />
      <h2 class="text-sm text-subtle">{{ t('detail.timeline') }}</h2>
      <Timeline :log="state.log" />

      <BottomBar>
        <button
          type="button"
          class="h-12 w-full rounded-xl bg-purple font-bold text-bg"
          data-testid="import"
          @click="save"
        >
          <span class="i-tabler-download mr-1 size-5" aria-hidden="true" />{{ t('import.action') }}
        </button>
      </BottomBar>
    </template>
  </AppShell>
</template>
