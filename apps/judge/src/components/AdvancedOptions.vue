<script setup lang="ts">
import {
  optionsFor,
  resolveOptions,
  type JudgeOptions,
  type OptionDef,
  type OptionId,
  type RoleCounts,
} from '@werewolf/rules'
import { Segmented, Switch } from '@werewolf/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * The advanced settings this board offers (they depend on its roles): a switch for yes/no
 * options, a row of choices for the others. Editable in the setup stage, read-only on a
 * record. Shows 「無進階設定」 when there are none.
 */
const props = defineProps<{ roles: RoleCounts; readonly?: boolean }>()
const values = defineModel<JudgeOptions>({ required: true })
const { t } = useI18n()
const offered = computed(() => optionsFor(props.roles))
const resolved = computed(
  () => resolveOptions(values.value) as unknown as Record<OptionId, boolean | string>,
)
const set = (id: OptionId, value: boolean | string) =>
  (values.value = { ...values.value, [id]: value })
const choices = (o: Extract<OptionDef, { kind: 'choice' }>) =>
  o.choices.map((c) => ({ value: c, label: t(`options.items.${o.id}.choices.${c}`) }))
const shown = (o: OptionDef) => {
  const v = resolved.value[o.id]
  if (o.kind === 'choice') return t(`options.items.${o.id}.choices.${v}`)
  return v ? t('options.on') : t('options.off')
}
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
    <ul v-else class="flex flex-col gap-3">
      <li
        v-for="o in offered"
        :key="o.id"
        class="flex flex-col gap-1"
        :data-testid="`option-${o.id}`"
      >
        <p
          v-if="readonly"
          class="flex min-h-10 items-center justify-between gap-2 rounded-xl bg-surface px-3"
        >
          <span>{{ t(`options.items.${o.id}.label`) }}</span>
          <span class="shrink-0 font-bold">{{ shown(o) }}</span>
        </p>
        <Switch
          v-else-if="o.kind === 'boolean'"
          :model-value="resolved[o.id] as boolean"
          :label="t(`options.items.${o.id}.label`)"
          @update:model-value="(v: boolean) => set(o.id, v)"
        />
        <template v-else>
          <h3 class="text-sm">{{ t(`options.items.${o.id}.label`) }}</h3>
          <Segmented
            :model-value="resolved[o.id] as string"
            :options="choices(o)"
            :label="t(`options.items.${o.id}.label`)"
            @update:model-value="(v: string) => set(o.id, v)"
          />
        </template>
        <p class="px-1 text-xs text-comment">{{ t(`options.items.${o.id}.hint`) }}</p>
      </li>
    </ul>
  </section>
</template>
