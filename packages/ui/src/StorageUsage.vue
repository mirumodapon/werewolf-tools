<script setup lang="ts">
import { formatBytes, getStorageInfo, type StorageInfo } from '@werewolf/storage'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

/** How much this site stores and whether the browser promised to keep it. */
const { t } = useI18n()
const info = ref<StorageInfo | null>(null)
onMounted(async () => (info.value = await getStorageInfo()))
</script>

<template>
  <div class="flex flex-col gap-1">
    <p v-if="!info">{{ t('common.loading') }}</p>
    <template v-else>
      <p v-if="info.usage !== null && info.quota !== null">
        {{ t('storage.usage', { used: formatBytes(info.usage), quota: formatBytes(info.quota) }) }}
      </p>
      <p v-else>{{ t('storage.unknown') }}</p>
      <p v-if="info.persisted !== null" class="text-sm text-comment">
        {{ info.persisted ? t('storage.persisted') : t('storage.notPersisted') }}
      </p>
    </template>
  </div>
</template>
