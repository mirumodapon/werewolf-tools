<script setup lang="ts">
import { AppShell, IconButton, LocalePicker, Segmented, Sheet, ThemePicker } from '@werewolf/ui'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import BoardsTab from './tabs/BoardsTab.vue'
import DealTab from './tabs/DealTab.vue'
import SpeakerTab from './tabs/SpeakerTab.vue'

type Tab = 'deal' | 'speaker' | 'boards'
const TABS: readonly Tab[] = ['deal', 'speaker', 'boards']

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const settingsOpen = ref(false)
const tab = computed({
  get: () => (TABS.includes(route.query.tab as Tab) ? (route.query.tab as Tab) : 'deal'),
  set: (next: Tab) => void router.replace({ query: next === 'deal' ? {} : { tab: next } }),
})
const tabOptions = computed(() => TABS.map((v) => ({ value: v, label: t(`tabs.${v}`) })))
/** The player count of a finished deal, passed from its done screen. */
const speakerCount = computed(() => {
  const n = Number(route.query.n)
  return Number.isInteger(n) && n > 0 ? n : undefined
})
</script>

<template>
  <AppShell :title="t('app.title')">
    <template #actions>
      <IconButton
        icon="i-tabler-history"
        :label="t('deal.history')"
        @click="router.push('/history')"
      />
      <IconButton
        icon="i-tabler-settings"
        :label="t('common.settings')"
        @click="settingsOpen = true"
      />
    </template>
    <Segmented v-model="tab" :options="tabOptions" :label="t('app.title')" />
    <DealTab v-if="tab === 'deal'" />
    <SpeakerTab v-else-if="tab === 'speaker'" :key="speakerCount" :initial-count="speakerCount" />
    <BoardsTab v-else />
    <Sheet v-model:open="settingsOpen" :title="t('common.settings')">
      <ThemePicker />
      <LocalePicker />
      <a href="/" class="text-sm text-blue underline"
        >{{ t('common.home') }} · {{ t('app.suite') }}</a
      >
    </Sheet>
  </AppShell>
</template>
