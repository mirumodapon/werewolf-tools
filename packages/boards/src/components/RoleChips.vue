<script setup lang="ts">
import { ROLE_IDS, ROLES, type RoleCounts } from '@werewolf/rules'
import { FACTION_CLASSES, ROLE_ICONS } from '@werewolf/ui'
import { computed } from 'vue'
import { useBoardText } from '../useBoardText.ts'

/** A board's cards as chips: icon, name, ×count. */
const props = defineProps<{ roles: RoleCounts }>()
const { roleName } = useBoardText()
const list = computed(() => ROLE_IDS.filter((id) => (props.roles[id] ?? 0) > 0))
</script>

<template>
  <ul class="flex flex-wrap gap-1">
    <li
      v-for="id in list"
      :key="id"
      class="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm"
      :class="[FACTION_CLASSES[ROLES[id].faction].bg, FACTION_CLASSES[ROLES[id].faction].text]"
    >
      <span :class="ROLE_ICONS[id]" class="size-4" aria-hidden="true" />
      {{ roleName(id) }}<template v-if="(roles[id] ?? 0) > 1"> ×{{ roles[id] }}</template>
    </li>
  </ul>
</template>
