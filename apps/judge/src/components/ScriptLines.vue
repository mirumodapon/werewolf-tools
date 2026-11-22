<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/** What the moderator says aloud, in order. */
defineProps<{ lines: readonly string[] }>()
const { t } = useI18n()
</script>

<template>
  <section class="flex flex-col gap-1 rounded-xl bg-surface p-3" data-testid="script">
    <h3 class="flex items-center gap-1 text-xs text-comment">
      <span class="i-tabler-speakerphone size-4" aria-hidden="true" />{{ t('play.script') }}
    </h3>
    <p v-for="(line, i) in lines" :key="i" class="text-lg leading-snug">{{ line }}</p>
  </section>
</template>
