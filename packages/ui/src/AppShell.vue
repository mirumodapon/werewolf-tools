<script setup lang="ts">
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { launchedFromHome } from './launcher.ts'
import { TOOL_KEY } from './setup.ts'
import StatusBadge from './StatusBadge.vue'

/**
 * Page frame: a sticky header (back button, title, actions) above the content. On a
 * tool's top page the title shows the tool's status, and leads home when the tool was
 * opened from the home app.
 */
const props = defineProps<{ title: string; backLabel?: string }>()
const emit = defineEmits<{ back: [] }>()
defineSlots<{ default(): unknown; actions?(): unknown }>()
const { t } = useI18n()
const tool = inject(TOOL_KEY, null)
const homeLink = !props.backLabel && tool !== null && tool.path !== '/' && launchedFromHome()
</script>

<template>
  <div class="mx-auto flex min-h-dvh max-w-xl flex-col">
    <header
      class="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-bg/90 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur"
    >
      <button
        v-if="backLabel"
        type="button"
        class="flex size-10 items-center justify-center rounded-full hover:bg-raised"
        :aria-label="backLabel"
        @click="emit('back')"
      >
        <span class="i-tabler-arrow-left size-6" aria-hidden="true" />
      </button>
      <h1
        class="flex min-w-0 flex-1 items-center gap-2 text-lg font-bold"
        :class="{ 'pl-2': !backLabel }"
      >
        <a
          v-if="homeLink"
          href="/"
          class="flex min-w-0 items-center gap-1"
          :title="t('common.home')"
          data-testid="home-link"
        >
          <span class="i-tabler-chevron-left size-5 shrink-0 text-comment" aria-hidden="true" />
          <span class="truncate">{{ title }}</span>
        </a>
        <span v-else class="truncate">{{ title }}</span>
        <StatusBadge v-if="!backLabel && tool" :status="tool.status" />
      </h1>
      <slot name="actions" />
    </header>
    <main class="flex flex-1 flex-col gap-4 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <slot />
    </main>
  </div>
</template>
