<script setup lang="ts">
import { listedTools, toolIconClass, type Locale, type ToolMeta } from '@werewolf/registry'
import {
  AppShell,
  IconButton,
  LocalePicker,
  markLaunchedFromHome,
  ResetData,
  ScanButton,
  Sheet,
  StatusBadge,
  ThemePicker,
} from '@werewolf/ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t, locale } = useI18n()
const router = useRouter()
const tools = listedTools()
const settingsOpen = ref(false)
const tx = (text: Record<Locale, string>) => text[locale.value as Locale]
const usable = (tool: ToolMeta) => tool.status !== 'coming-soon'
</script>

<template>
  <AppShell :title="t('home.title')">
    <template #actions>
      <ScanButton />
      <IconButton
        icon="i-tabler-settings"
        :label="t('common.settings')"
        @click="settingsOpen = true"
      />
      <IconButton
        icon="i-tabler-info-circle"
        :label="t('common.info')"
        data-testid="info"
        @click="router.push('/info')"
      />
    </template>

    <h2 class="text-sm text-subtle">{{ t('home.tools') }}</h2>
    <ul class="flex flex-col gap-3">
      <li v-for="tool in tools" :key="tool.id">
        <component
          :is="usable(tool) ? 'a' : 'div'"
          :href="usable(tool) ? tool.path : undefined"
          class="flex items-center gap-4 rounded-2xl border border-border bg-raised p-4"
          :class="usable(tool) ? 'hover:border-purple' : 'opacity-60'"
          :data-testid="`tool-${tool.id}`"
          @click="usable(tool) && markLaunchedFromHome()"
        >
          <span
            class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-bg"
            :style="{ color: `var(--tn-${tool.accent})` }"
          >
            <span :class="toolIconClass(tool)" class="size-7" aria-hidden="true" />
          </span>
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="flex items-center gap-2 font-bold">
              {{ tx(tool.name) }}
              <StatusBadge :status="tool.status" />
            </span>
            <span class="text-sm text-muted">{{ tx(tool.description) }}</span>
          </span>
          <span
            v-if="usable(tool)"
            class="i-tabler-chevron-right size-5 text-comment"
            aria-hidden="true"
          />
        </component>
      </li>
    </ul>
    <p class="mt-auto text-center text-xs text-comment">{{ t('home.disclaimer') }}</p>

    <Sheet v-model:open="settingsOpen" :title="t('common.settings')">
      <ThemePicker />
      <LocalePicker />
      <ResetData />
    </Sheet>
  </AppShell>
</template>
