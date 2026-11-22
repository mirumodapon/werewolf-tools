<script setup lang="ts">
import type { LogEntry } from '@werewolf/rules'
import { computed } from 'vue'
import { useJudgeText } from '../useJudgeText.ts'

/** The game's log, grouped by night and day. */
const props = defineProps<{ log: readonly LogEntry[] }>()
const { t, logText } = useJudgeText()
const groups = computed(() => {
  const out: { key: string; title: string; entries: LogEntry[] }[] = []
  for (const e of props.log) {
    const key = `${e.round}-${e.phase}`
    if (out.at(-1)?.key !== key)
      out.push({ key, title: t(`detail.rounds.${e.phase}`, { n: e.round }), entries: [] })
    out.at(-1)!.entries.push(e)
  }
  return out
})
</script>

<template>
  <ol class="flex flex-col gap-3" data-testid="timeline">
    <li v-for="g in groups" :key="g.key" class="flex flex-col gap-1">
      <h3 class="flex items-center gap-1 text-sm font-bold text-subtle">
        <span
          :class="
            g.key.endsWith('night') ? 'i-tabler-moon text-purple' : 'i-tabler-sun text-yellow'
          "
          class="size-4"
          aria-hidden="true"
        />{{ g.title }}
      </h3>
      <ul class="flex flex-col gap-0.5 border-l border-border pl-3 text-sm">
        <li
          v-for="(e, i) in g.entries"
          :key="i"
          :class="{
            'font-bold text-red': e.kind === 'death',
            'font-bold text-green': e.kind === 'end',
          }"
        >
          {{ logText(e) }}
        </li>
      </ul>
    </li>
  </ol>
</template>
