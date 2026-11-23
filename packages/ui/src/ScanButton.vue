<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import IconButton from './IconButton.vue'
import QrScanner from './QrScanner.vue'

/** Header button that opens the QR scanner (share links of boards, hand-offs and games). */
const { t } = useI18n()
const open = ref(false)
</script>

<template>
  <IconButton
    icon="i-tabler-scan"
    :label="t('scan.title')"
    data-testid="scan"
    @click="open = true"
  />
  <QrScanner v-model:open="open" />
</template>
