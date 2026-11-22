<script setup lang="ts">
import {
  optionsFor,
  resolveOptions,
  type JudgeOptions,
  type OptionId,
  type RoleCounts,
} from '@werewolf/rules'
import { Switch } from '@werewolf/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * The advanced settings this board offers (they depend on its roles). Editable in the
 * setup stage, read-only on a record. Shows 「無進階設定」 when there are none.
 */
const props = defineProps<{ roles: RoleCounts; readonly?: boolean }>()
const values = defineModel<JudgeOptions>({ required: true })
const { t } = useI18n()
const offered = computed(() => optionsFor(props.roles))
const resolved = computed(() => resolveOptions(values.value))
const set = (id: OptionId, value: boolean) => (values.value = { ...values.value, [id]: value })
</script>

<template>
  <section class="flex flex-col gap-2" data-testid="advanced-options">
    <h2 class="text-sm font-bold text-subtle">{{ t('options.title') }}</h2>
    <p
      v-if="!offered.length"
      class="rounded-xl bg-surface p-3 text-comment"
      data-testid="no-options"
    >
      {{ t('options.none') }}
    </p>
    <ul v-else class="flex flex-col gap-2">
      <li
        v-for="o in offered"
        :key="o.id"
        class="flex flex-col gap-1"
        :data-testid="`option-${o.id}`"
      >
        <Switch
          v-if="!readonly"
          :model-value="resolved[o.id]"
          :label="t(`options.items.${o.id}.label`)"
          @update:model-value="(v: boolean) => set(o.id, v)"
        />
        <p
          v-else
          class="flex min-h-10 items-center justify-between gap-2 rounded-xl bg-surface px-3"
        >
          <span>{{ t(`options.items.${o.id}.label`) }}</span>
          <span class="font-bold">{{ resolved[o.id] ? t('options.on') : t('options.off') }}</span>
        </p>
        <p class="px-1 text-xs text-comment">{{ t(`options.items.${o.id}.hint`) }}</p>
      </li>
    </ul>
  </section>
</template>
