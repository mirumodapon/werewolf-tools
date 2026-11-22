<script setup lang="ts">
import { AppRoot, AppShell, IconButton, LocalePicker, Sheet, ThemePicker } from '@werewolf/ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const settingsOpen = ref(false)
</script>

<template>
  <AppRoot>
    <AppShell :title="t('app.title')">
      <template #actions>
        <IconButton
          icon="i-tabler-settings"
          :label="t('common.settings')"
          @click="settingsOpen = true"
        />
      </template>
      <p class="text-muted">{{ t('app.title') }}</p>
      <Sheet v-model:open="settingsOpen" :title="t('common.settings')">
        <ThemePicker />
        <LocalePicker />
      </Sheet>
    </AppShell>
  </AppRoot>
</template>
