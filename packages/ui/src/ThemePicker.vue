<script setup lang="ts">
import { THEME_MODES, type ThemeMode } from '@werewolf/theme'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Segmented from './Segmented.vue'
import { useThemeStore } from './themeStore.ts'

const { t } = useI18n()
const store = useThemeStore()
const mode = computed({ get: () => store.mode, set: (m: ThemeMode) => store.setMode(m) })
const options = computed(() => THEME_MODES.map((m) => ({ value: m, label: t(`theme.${m}`) })))
</script>

<template>
  <section class="flex flex-col gap-2">
    <h3 class="text-sm text-subtle">{{ t('theme.label') }}</h3>
    <Segmented v-model="mode" :options="options" :label="t('theme.label')" />
  </section>
</template>
