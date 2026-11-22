<script setup lang="ts">
import { SHARED_MESSAGES } from '@werewolf/i18n'
import { FACTIONS, rolesOf } from '@werewolf/rules'

/** Every role by faction, with the one-line description the cards show (from the tools). */
const zh = SHARED_MESSAGES['zh-TW']
</script>

<template>
  <template v-for="f in FACTIONS" :key="f">
    <h3 :class="`ww-${f}`">{{ zh.factions[f] }}</h3>
    <table>
      <thead>
        <tr>
          <th>角色</th>
          <th>代號</th>
          <th>能力（卡片上的簡述）</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="id in rolesOf(f)" :key="id">
          <td :class="`ww-${f}`"><strong>{{ zh.roles[id].name }}</strong></td>
          <td><code>{{ id }}</code></td>
          <td>{{ zh.roles[id].desc }}</td>
        </tr>
      </tbody>
    </table>
  </template>
</template>
