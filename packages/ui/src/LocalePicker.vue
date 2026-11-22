<script setup lang="ts">
import { LOCALES, type Locale } from '@werewolf/i18n'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleStore } from './localeStore.ts'
import Segmented from './Segmented.vue'

const { t } = useI18n()
const store = useLocaleStore()
const locale = computed({ get: () => store.locale, set: (l: Locale) => store.setLocale(l) })
const options = computed(() => LOCALES.map((l) => ({ value: l, label: t(`locale.${l}`) })))
</script>

<template>
  <section class="flex flex-col gap-2">
    <h3 class="text-sm text-subtle">{{ t('locale.label') }}</h3>
    <Segmented v-model="locale" :options="options" :label="t('locale.label')" />
  </section>
</template>
