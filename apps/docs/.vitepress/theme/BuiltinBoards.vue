<script setup lang="ts">
import { SHARED_MESSAGES } from '@werewolf/i18n'
import {
  BUILTIN_BOARDS,
  isUnverified,
  playerCount,
  ROLE_IDS,
  ROLES,
  type Board,
} from '@werewolf/rules'

/** The built-in boards straight from @werewolf/rules, so this page never goes stale. */
const zh = SHARED_MESSAGES['zh-TW']
const roles = (b: Board) =>
  ROLE_IDS.filter((id) => (b.roles[id] ?? 0) > 0).map((id) => ({
    id,
    text: `${zh.roles[id].name}${(b.roles[id] ?? 0) > 1 ? ` ×${b.roles[id]}` : ''}`,
    faction: ROLES[id].faction,
  }))
const rules = (b: Board) =>
  [
    zh.rules.win[b.rules.win],
    `女巫：${zh.rules.witchSelfSave[b.rules.witchSelfSave]}`,
    `同守同救：${zh.rules.guardSaveConflict[b.rules.guardSaveConflict]}`,
    `警長：${b.rules.sheriff ? '有' : '無'}`,
    zh.rules.lastWords[b.rules.lastWords],
  ].join('・')
const name = (b: Board) => (typeof b.name === 'string' ? b.name : b.name['zh-TW'])
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>人數</th>
        <th>板子</th>
        <th>角色</th>
        <th>設定</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="b in BUILTIN_BOARDS" :key="b.id">
        <td>{{ playerCount(b.roles) }}</td>
        <td>
          <strong>{{ name(b) }}</strong>
          <br /><span v-if="isUnverified(b)" class="ww-unverified">⚠ 未驗證</span>
        </td>
        <td>
          <template v-for="(r, i) in roles(b)" :key="r.id"
            ><span :class="`ww-${r.faction}`">{{ r.text }}</span
            ><template v-if="i < roles(b).length - 1">、</template></template
          >
        </td>
        <td>{{ rules(b) }}</td>
      </tr>
    </tbody>
  </table>
</template>
