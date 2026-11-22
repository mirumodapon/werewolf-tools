<script setup lang="ts">
import {
  BoardIssues,
  decodeBoard,
  RoleChips,
  RulesSummary,
  useBoardsStore,
  useBoardText,
  type SharedBoard,
} from '@werewolf/boards'
import { checkBoard, hasErrors, playerCount } from '@werewolf/rules'
import { AppShell } from '@werewolf/ui'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings.ts'

/** Preview of a shared board (`?b=`) with its check, before saving it here. */
const props = defineProps<{ payload?: string }>()
const { t } = useBoardText()
const router = useRouter()
const boards = useBoardsStore()
const settings = useSettingsStore()
const board = ref<SharedBoard | null | undefined>(undefined)

onMounted(async () => {
  try {
    board.value = props.payload ? await decodeBoard(props.payload) : null
  } catch {
    board.value = null
  }
})

const issues = computed(() => (board.value ? checkBoard(board.value.roles) : []))

function importBoard() {
  if (!board.value || hasErrors(issues.value)) return
  const id = boards.save({
    name: board.value.name,
    roles: board.value.roles,
    rules: board.value.rules,
  })
  settings.playerCount = playerCount(board.value.roles)
  settings.boardId = id
  void router.replace({ path: '/', query: { tab: 'boards' } })
}
</script>

<template>
  <AppShell :title="t('import.title')" :back-label="t('common.back')" @back="router.replace('/')">
    <p v-if="board === null" class="py-8 text-center text-red" role="alert">
      {{ t('import.invalid') }}
    </p>
    <template v-else-if="board">
      <div class="flex flex-col gap-2 rounded-xl border border-border p-3">
        <div class="flex items-center gap-2">
          <span class="flex-1 text-lg font-bold">{{ board.name }}</span>
          <span class="text-comment">{{
            t('common.players', { n: playerCount(board.roles) })
          }}</span>
        </div>
        <RoleChips :roles="board.roles" />
        <RulesSummary :rules="board.rules" />
      </div>
      <BoardIssues :issues="issues" show-ok />
      <button
        type="button"
        class="h-12 rounded-xl bg-purple font-bold text-bg disabled:opacity-40"
        :disabled="hasErrors(issues)"
        data-testid="import"
        @click="importBoard"
      >
        <span class="i-tabler-download mr-1 size-5" aria-hidden="true" />{{ t('import.action') }}
      </button>
    </template>
  </AppShell>
</template>
