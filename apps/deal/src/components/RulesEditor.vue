<script setup lang="ts">
import { GUARD_SAVE_CONFLICT, LAST_WORDS, WIN_CONDITIONS, type BoardRules } from '@werewolf/rules'
import { Segmented, Switch } from '@werewolf/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/** Edits a board's settings (板子設定). */
const rules = defineModel<BoardRules>({ required: true })
const { t } = useI18n()
const set = <K extends keyof BoardRules>(key: K, value: BoardRules[K]) =>
  (rules.value = { ...rules.value, [key]: value })
const field = <K extends keyof BoardRules>(key: K) =>
  computed({ get: () => rules.value[key], set: (v: BoardRules[K]) => set(key, v) })
const win = field('win')
const conflict = field('guardSaveConflict')
const sheriff = field('sheriff')
const lastWords = field('lastWords')
const options = <T extends string>(values: readonly T[], prefix: string) =>
  computed(() => values.map((v) => ({ value: v, label: t(`${prefix}.${v}`) })))
const winOptions = options(WIN_CONDITIONS, 'rules.win')
const conflictOptions = options(GUARD_SAVE_CONFLICT, 'rules.guardSaveConflict')
const lastWordsOptions = options(LAST_WORDS, 'rules.lastWords')
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="text-sm font-bold text-subtle">{{ t('rules.title') }}</h2>
    <div class="flex flex-col gap-1">
      <h3 class="text-sm text-subtle">{{ t('rules.win.label') }}</h3>
      <Segmented v-model="win" :options="winOptions" :label="t('rules.win.label')" />
      <p class="text-xs text-comment">{{ t(`rules.winHint.${win}`) }}</p>
    </div>
    <div class="flex flex-col gap-1">
      <h3 class="text-sm text-subtle">{{ t('rules.guardSaveConflict.label') }}</h3>
      <Segmented
        v-model="conflict"
        :options="conflictOptions"
        :label="t('rules.guardSaveConflict.label')"
      />
    </div>
    <div class="flex flex-col gap-1">
      <h3 class="text-sm text-subtle">{{ t('rules.lastWords.label') }}</h3>
      <Segmented
        v-model="lastWords"
        :options="lastWordsOptions"
        :label="t('rules.lastWords.label')"
      />
    </div>
    <Switch v-model="sheriff" :label="t('rules.sheriff.label')" />
  </section>
</template>
