<script setup lang="ts">
import {
  BoardCard,
  BOARD_PARAM,
  encodeBoard,
  useBoardsStore,
  useBoardText,
  type CustomBoard,
} from '@werewolf/boards'
import { BUILTIN_BOARDS, playerCount, type Board } from '@werewolf/rules'
import { shareUrl } from '@werewolf/share'
import { ShareSheet, useConfirm } from '@werewolf/ui'
import { computed, ref } from 'vue'

const { t, boardName } = useBoardText()
const boards = useBoardsStore()
const confirm = useConfirm()
const shareOpen = ref(false)
const sharing = ref({ name: '', url: '' })

const groups = computed(() => {
  const byCount = new Map<number, Board[]>()
  for (const b of BUILTIN_BOARDS)
    byCount.set(playerCount(b.roles), [...(byCount.get(playerCount(b.roles)) ?? []), b])
  return [...byCount.entries()]
})

async function share(b: CustomBoard) {
  sharing.value = { name: b.name, url: '' }
  shareOpen.value = true
  const payload = await encodeBoard({ name: b.name, roles: b.roles, rules: b.rules })
  sharing.value = { name: b.name, url: shareUrl(location.href, BOARD_PARAM, payload) }
}

async function remove(b: CustomBoard) {
  if (
    await confirm({
      message: t('boards.deleteConfirm', { name: boardName(b.name) }),
      confirmLabel: t('common.delete'),
      danger: true,
    })
  )
    boards.remove(b.id)
}
</script>

<template>
  <RouterLink
    to="/boards/new"
    class="flex h-12 items-center justify-center gap-2 rounded-xl bg-purple font-bold text-bg"
  >
    <span class="i-tabler-plus size-5" aria-hidden="true" />{{ t('boards.new') }}
  </RouterLink>

  <section class="flex flex-col gap-2">
    <h2 class="text-sm text-subtle">{{ t('boards.customList') }}</h2>
    <p v-if="!boards.customs.length" class="text-comment">{{ t('boards.emptyCustom') }}</p>
    <ul class="flex flex-col gap-2">
      <li v-for="b in boards.customs" :key="b.id" class="rounded-xl border border-border p-3">
        <BoardCard :board="b" show-count>
          <template #actions>
            <span class="flex gap-1 text-sm">
              <RouterLink :to="`/boards/${b.id}`" class="rounded-lg bg-surface px-3 py-1.5"
                ><span class="i-tabler-pencil mr-1 size-4" aria-hidden="true" />{{
                  t('common.edit')
                }}</RouterLink
              >
              <RouterLink
                :to="{ path: '/boards/new', query: { from: b.id } }"
                class="rounded-lg bg-surface px-3 py-1.5"
                ><span class="i-tabler-copy mr-1 size-4" aria-hidden="true" />{{
                  t('common.copy')
                }}</RouterLink
              >
              <button type="button" class="rounded-lg bg-surface px-3 py-1.5" @click="share(b)">
                <span class="i-tabler-share mr-1 size-4" aria-hidden="true" />{{
                  t('common.share')
                }}
              </button>
              <button
                type="button"
                class="ml-auto rounded-lg px-3 py-1.5 text-red"
                :aria-label="t('common.delete')"
                @click="remove(b)"
              >
                <span class="i-tabler-trash size-4" aria-hidden="true" />
              </button>
            </span>
          </template>
        </BoardCard>
      </li>
    </ul>
  </section>

  <section class="flex flex-col gap-3">
    <h2 class="text-sm text-subtle">{{ t('boards.builtinList') }}</h2>
    <div v-for="[n, list] in groups" :key="n" class="flex flex-col gap-2">
      <h3 class="font-mono text-sm text-comment">{{ t('common.players', { n }) }}</h3>
      <ul class="flex flex-col gap-2">
        <li v-for="b in list" :key="b.id" class="rounded-xl border border-border p-3">
          <BoardCard :board="b">
            <template #actions>
              <RouterLink
                :to="{ path: '/boards/new', query: { from: b.id } }"
                class="self-start rounded-lg bg-surface px-3 py-1.5 text-sm"
              >
                <span class="i-tabler-copy mr-1 size-4" aria-hidden="true" />{{ t('common.copy') }}
              </RouterLink>
            </template>
          </BoardCard>
        </li>
      </ul>
    </div>
  </section>

  <ShareSheet
    v-model:open="shareOpen"
    :title="t('boards.shareTitle')"
    :name="sharing.name"
    :url="sharing.url"
  />
</template>
