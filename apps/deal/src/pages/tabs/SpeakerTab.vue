<script setup lang="ts">
import { MAX_PLAYERS } from '@werewolf/rules'
import { Stepper, Switch } from '@werewolf/ui'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { drawSpeaker, type SpeakerDraw } from '../../flow/speaker.ts'
import { useSettingsStore } from '../../stores/settings.ts'

/** Who speaks first (and which way round). Nothing is saved. */
const props = defineProps<{ initialCount?: number }>()
const { t } = useI18n()
const settings = useSettingsStore()
const count = ref(props.initialCount ?? settings.playerCount)
const result = ref<SpeakerDraw | null>(null)
watch(count, () => (result.value = null))
const draw = () => (result.value = drawSpeaker(count.value, settings.speakerWithDirection))
</script>

<template>
  <section class="flex flex-col items-center gap-2">
    <h2 class="self-start text-sm text-subtle">{{ t('speaker.players') }}</h2>
    <Stepper v-model="count" :label="t('speaker.players')" :min="2" :max="MAX_PLAYERS" size="lg" />
  </section>
  <Switch v-model="settings.speakerWithDirection" :label="t('speaker.withDirection')" />
  <div
    class="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-raised p-6 text-center"
    aria-live="polite"
  >
    <template v-if="result">
      <p class="text-comment">{{ t('speaker.first') }}</p>
      <p class="text-6xl font-bold text-purple" data-testid="speaker-result">
        {{ t('common.seat', { n: result.seat }) }}
        <template v-if="result.direction">
          <br /><span class="text-4xl text-cyan">
            <span
              :class="result.direction === 'cw' ? 'i-tabler-rotate-clockwise' : 'i-tabler-rotate'"
              class="size-9"
              aria-hidden="true"
            />
            {{ t(`speaker.${result.direction}`) }}</span
          >
        </template>
      </p>
    </template>
    <span v-else class="i-tabler-speakerphone size-16 text-comment" aria-hidden="true" />
  </div>
  <button
    type="button"
    class="flex h-14 items-center justify-center gap-2 rounded-2xl bg-purple text-lg font-bold text-bg"
    data-testid="draw"
    @click="draw"
  >
    <span class="i-tabler-arrows-shuffle size-6" aria-hidden="true" />{{
      result ? t('speaker.again') : t('speaker.draw')
    }}
  </button>
</template>
