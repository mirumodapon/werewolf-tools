<script setup lang="ts">
import {
  mapSeat,
  PACK_ROLES,
  resolveOptions,
  player,
  seerResult,
  witchOptions,
  type GameEvent,
  type GameState,
  type RoleId,
  type Step,
} from '@werewolf/rules'
import { BottomBar, SeatPicker } from '@werewolf/ui'
import { computed, ref } from 'vue'
import { useJudgeText } from '../useJudgeText.ts'
import ScriptLines from './ScriptLines.vue'

/**
 * One step of the game: the lines to say, then the moderator's input. Emits the input as
 * a GameEvent. Mount it with a key per step so its form starts empty.
 */
const props = defineProps<{ step: Step; state: GameState }>()
const emit = defineEmits<{ submit: [event: GameEvent] }>()
const { t, seat, seats, lines, roleName } = useJudgeText()

const count = computed(() => props.state.players.length)
const dead = computed(() => props.state.players.filter((p) => !p.alive).map((p) => p.seat))
const roleLabel = computed(() => (props.step.role ? roleName(props.step.role) : ''))

// Form state (fresh for every step: the parent keys this component by step).
const actor = ref<number | null>(null)
const actors = ref<number[]>([])
/** Night 1: which picked wolf is each special wolf (狼王, 白狼王). */
const specials = ref<Partial<Record<RoleId, number | null>>>({})
const pickSpecial = (role: RoleId, seat: number | null) =>
  (specials.value = { ...specials.value, [role]: seat })
const target = ref<number | null>(null)
/** The explicit "nobody" choices (空守, 空刀, 不毒…): picking nothing is not the same as choosing nobody. */
const targetNone = ref(false)
const pair = ref<number[]>([])
const pairNone = ref(false)
const save = ref(false)
const poison = ref<number | null>(null)
const poisonNone = ref(false)
const dayAction = ref<'vote' | 'explode' | 'duel'>('vote')
const blast = ref<number | null>(null)
const blastNone = ref(false)

/** The seat acting this step: known, or picked now (first night). */
const acting = computed(() => (props.step.identify ? actor.value : props.step.actor))
const needsActor = computed(() => props.step.identify && !props.step.dead)
/** Seats that cannot be picked as the holder: already known as another role. */
const notHolder = computed(() =>
  props.state.players
    .filter(
      (p) =>
        p.role !== null &&
        p.role !== props.step.role &&
        !(p.role === 'werewolf' && props.step.role && PACK_ROLES.includes(props.step.role)),
    )
    .map((p) => p.seat),
)

const witch = computed(() =>
  props.step.id === 'witch' && acting.value !== null
    ? witchOptions(props.state, player(props.state, acting.value))
    : props.step.witch,
)
const seerSays = computed(() =>
  target.value === null ? null : seerResult(props.state, target.value),
)
const hunterCanShoot = computed(() => {
  if (props.step.id !== 'hunter' || acting.value === null) return props.step.hunterCanShoot
  const t = props.state.tonight
  return !(t.poison !== null && mapSeat(t, t.poison) === acting.value)
})
const firstNight = computed(() => props.state.round === 1)
/** Out before today: cannot stand for sheriff. The night's dead still may (they do not know yet). */
const outBefore = computed(() =>
  props.state.players
    .filter((p) => p.death && (p.death.phase === 'day' || p.death.round < props.state.round))
    .map((p) => p.seat),
)
const explodable = computed(() =>
  props.state.players
    .filter((p) => p.alive && (p.role === null || props.step.day?.wolves.includes(p.seat)))
    .map((p) => p.seat),
)
const explodingRole = computed<RoleId | null>(() =>
  actor.value === null ? null : player(props.state, actor.value).role,
)

const script = computed<string[]>(() => {
  const s = props.step
  const role = roleLabel.value
  switch (s.id) {
    case 'identify':
      return lines('script.identify', { role })
    case 'wolves': {
      const out = lines(firstNight.value ? 'script.wolvesFirst' : 'script.wolves')
      const named = s.wolves?.specials ?? []
      if (named.length)
        out.splice(1, 0, t('script.specialsShow', { roles: named.map(roleName).join('、') }))
      return out
    }
    case 'witch': {
      const w = witch.value
      const told = w?.told
        ? w.victim === null
          ? t('script.witchNoKill')
          : t('script.witchVictim', { n: w.victim })
        : t('script.witchNotTold')
      return [...lines('script.witch'), told, t('script.witchPoison'), t('script.witchClose')]
    }
    case 'sheriff':
      return lines('script.sheriff')
    case 'deaths': {
      const d = s.deaths!
      const out = [
        firstNight.value && props.state.setup.rules.sheriff ? '' : t('script.dawn'),
        d.seats.length ? t('script.deaths', { seats: seats(d.seats) }) : t('script.peaceful'),
      ]
      if (d.seats.length)
        out.push(
          d.lastWords.length
            ? t('script.lastWords', { seats: seats(d.lastWords) })
            : t('script.noLastWords'),
        )
      return out.filter(Boolean)
    }
    case 'shoot':
      return [t('script.shoot', { seat: seat(s.shooter!), role })]
    case 'badge':
      return [t('script.badge', { seat: seat(s.badgeFrom!) })]
    case 'day': {
      const d = s.day!
      const out = [t('script.day')]
      if (d.sheriff !== null && player(props.state, d.sheriff).alive)
        out.push(t('script.sheriffVote', { seat: seat(d.sheriff) }))
      if (d.curse !== null && player(props.state, d.curse).alive)
        out.push(t('script.curse', { seat: seat(d.curse) }))
      if (d.cannotVote.length) out.push(t('script.cannotVote', { seats: seats(d.cannotVote) }))
      return out
    }
    default:
      return lines(`script.${s.id}`)
  }
})

/** A seat chosen, or "nobody" chosen on purpose. */
const decided = () => target.value !== null || targetNone.value
const specialsOk = () => {
  const roles = props.step.wolves?.specials ?? []
  const picked = roles.map((r) => specials.value[r])
  return (
    picked.every((seat) => seat != null && actors.value.includes(seat)) &&
    new Set(picked).size === roles.length
  )
}

/** Every input of the step is filled in (防呆): until then the button stays disabled. */
const valid = computed(() => {
  const s = props.step
  if (s.dead) return true
  if (needsActor.value && actor.value === null && s.id !== 'wolves') return false
  switch (s.id) {
    case 'cupid':
      return pair.value.length === 2
    case 'mixedBlood':
    case 'wildChild':
    case 'seer':
      return target.value !== null
    case 'magician':
      return pair.value.length === 2 || pairNone.value
    case 'wolves':
      return (
        (!s.identify || (actors.value.length === s.wolves!.expected && specialsOk())) && decided()
      )
    case 'guard':
    case 'wolfBeauty':
    case 'crow':
    case 'sheriff':
    case 'shoot':
    case 'badge':
      return decided()
    case 'witch':
      return save.value || !witch.value?.poison || poison.value !== null || poisonNone.value
    case 'identify':
      return actor.value !== null
    case 'day':
      if (dayAction.value === 'vote') return decided()
      if (dayAction.value === 'explode')
        return (
          actor.value !== null &&
          (explodingRole.value !== 'whiteWolfKing' || blast.value !== null || blastNone.value)
        )
      return (s.day!.knight !== null || actor.value !== null) && target.value !== null
    default:
      return true
  }
})

function submit() {
  if (!valid.value) return
  const s = props.step
  const who = needsActor.value && actor.value !== null ? { actor: actor.value } : {}
  let event: GameEvent
  switch (s.id) {
    case 'dusk':
    case 'lovers':
    case 'deaths':
      event = { step: s.id }
      break
    case 'cupid':
      event = s.dead
        ? { step: 'cupid' }
        : { step: 'cupid', ...who, lovers: [pair.value[0]!, pair.value[1]!] }
      break
    case 'mixedBlood':
    case 'wildChild':
      event = s.dead ? { step: s.id } : { step: s.id, ...who, target: target.value! }
      break
    case 'magician':
      event = s.dead
        ? { step: 'magician' }
        : {
            step: 'magician',
            ...who,
            swap: pair.value.length === 2 ? [pair.value[0]!, pair.value[1]!] : null,
          }
      break
    case 'guard':
    case 'crow':
      event = s.dead ? { step: s.id } : { step: s.id, ...who, target: target.value }
      break
    case 'wolves':
      event = s.dead
        ? { step: 'wolves' }
        : {
            step: 'wolves',
            ...(s.identify
              ? {
                  actors: actors.value,
                  specials: Object.fromEntries(
                    (s.wolves?.specials ?? []).map((r) => [r, specials.value[r]!]),
                  ),
                }
              : {}),
            kill: target.value,
          }
      break
    case 'identify':
      event = { step: 'identify', role: s.role!, actor: actor.value! }
      break
    case 'wolfBeauty':
      event = s.dead ? { step: 'wolfBeauty' } : { step: 'wolfBeauty', ...who, target: target.value }
      break
    case 'hiddenWolf':
    case 'gravekeeper':
    case 'hunter':
      event = { step: s.id, ...who }
      break
    case 'witch':
      event = s.dead
        ? { step: 'witch' }
        : { step: 'witch', ...who, save: save.value, poison: save.value ? null : poison.value }
      break
    case 'seer':
      event = s.dead ? { step: 'seer' } : { step: 'seer', ...who, target: target.value }
      break
    case 'sheriff':
      event = { step: 'sheriff', seat: target.value }
      break
    case 'shoot':
      event = { step: 'shoot', target: target.value }
      break
    case 'badge':
      event = { step: 'badge', to: target.value }
      break
    case 'day':
      event =
        dayAction.value === 'vote'
          ? { step: 'day', action: 'vote', exiled: target.value }
          : dayAction.value === 'explode'
            ? {
                step: 'day',
                action: 'explode',
                actor: actor.value!,
                target: explodingRole.value === 'whiteWolfKing' ? blast.value : null,
              }
            : {
                step: 'day',
                action: 'duel',
                actor: s.day!.knight ?? actor.value!,
                target: target.value!,
              }
      break
  }
  emit('submit', event)
}

function chooseDayAction(action: 'vote' | 'explode' | 'duel') {
  dayAction.value = action
  actor.value = null
  target.value = null
  targetNone.value = false
  blast.value = null
  blastNone.value = false
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-3">
    <h2 class="flex items-center gap-2 text-xl font-bold" data-testid="step-title">
      {{ step.id === 'identify' ? `${t('steps.identify')}・${roleLabel}` : t(`steps.${step.id}`) }}
      <span
        v-if="step.actor !== null && !step.identify && step.role"
        class="text-sm font-normal text-comment"
        >{{ seat(step.actor) }}</span
      >
    </h2>
    <ScriptLines :lines="script" />

    <p
      v-if="step.dead"
      class="flex items-start gap-2 rounded-xl bg-raised p-3 text-orange"
      data-testid="dead-note"
    >
      <span class="i-tabler-ghost-2 mt-0.5 size-5 shrink-0" aria-hidden="true" />{{
        t('play.dead', { role: roleLabel })
      }}
    </p>

    <template v-else>
      <!-- Who holds the role (first night). -->
      <section v-if="needsActor && step.id !== 'wolves'" class="flex flex-col gap-2">
        <h3 class="text-sm text-subtle">{{ t('play.whoIs', { role: roleLabel }) }}</h3>
        <SeatPicker
          v-model="actor"
          :count="count"
          :label="t('play.whoIs', { role: roleLabel })"
          :dead="dead"
          :disabled="notHolder"
        />
      </section>

      <section v-if="step.id === 'wolves' && step.identify" class="flex flex-col gap-2">
        <h3 class="text-sm text-subtle">
          {{ t('play.whoAreWolves', { n: step.wolves!.expected }) }}
          <span
            class="font-mono"
            :class="actors.length === step.wolves!.expected ? 'text-green' : 'text-orange'"
            data-testid="wolves-count"
            >{{ actors.length }}／{{ step.wolves!.expected }}</span
          >
        </h3>
        <SeatPicker
          v-model="actors"
          multiple
          :max="step.wolves!.expected"
          :count="count"
          :label="t('steps.wolves')"
          :dead="dead"
          :disabled="notHolder"
        />
        <template v-for="r in step.wolves!.specials" :key="r">
          <h3 class="text-sm text-subtle">{{ t('play.whichSpecial', { role: roleName(r) }) }}</h3>
          <SeatPicker
            :model-value="specials[r] ?? null"
            :count="count"
            :label="t('play.whichSpecial', { role: roleName(r) })"
            :dead="dead"
            :disabled="
              state.players
                .map((p) => p.seat)
                .filter(
                  (n) =>
                    !actors.includes(n) ||
                    Object.entries(specials).some(([k, v]) => k !== r && v === n),
                )
            "
            :data-testid="`special-${r}`"
            @update:model-value="(v) => pickSpecial(r, v as number | null)"
          />
        </template>
      </section>

      <section v-if="step.id === 'cupid' || step.id === 'magician'" class="flex flex-col gap-2">
        <h3 class="text-sm text-subtle">
          {{ step.id === 'cupid' ? t('inputs.lovers') : t('inputs.swap') }}
        </h3>
        <SeatPicker
          v-model="pair"
          v-model:none="pairNone"
          multiple
          :max="2"
          :count="count"
          :label="t(`steps.${step.id}`)"
          :dead="dead"
          :none-label="step.id === 'magician' ? t('inputs.noSwap') : undefined"
        />
      </section>

      <section
        v-if="
          ['mixedBlood', 'wildChild', 'guard', 'wolves', 'wolfBeauty', 'seer', 'crow'].includes(
            step.id,
          )
        "
        class="flex flex-col gap-2"
      >
        <h3 class="text-sm text-subtle">
          {{
            {
              mixedBlood: t('inputs.model'),
              wildChild: t('inputs.model'),
              guard: t('inputs.guard'),
              wolves: t('inputs.kill'),
              wolfBeauty: t('inputs.charm'),
              seer: t('inputs.check'),
              crow: t('inputs.curse'),
            }[step.id as string]
          }}
        </h3>
        <SeatPicker
          v-model="target"
          v-model:none="targetNone"
          :none-label="
            (
              {
                guard: t('inputs.noGuard'),
                wolves: t('inputs.noKill'),
                wolfBeauty: t('inputs.noCharm'),
                crow: t('inputs.noCurse'),
              } as Record<string, string>
            )[step.id]
          "
          :count="count"
          :label="t(`steps.${step.id}`)"
          :dead="step.id === 'seer' ? [] : dead"
          :disabled="[
            ...(step.id === 'guard' && step.guardForbidden != null ? [step.guardForbidden] : []),
            ...(step.id === 'guard' &&
            !resolveOptions(state.setup.options).guardSelf &&
            acting !== null
              ? [acting]
              : []),
            ...(['mixedBlood', 'wildChild', 'wolfBeauty', 'seer'].includes(step.id) &&
            acting !== null
              ? [acting]
              : []),
          ]"
        />
        <p
          v-if="step.id === 'seer' && seerSays"
          class="rounded-xl bg-raised p-3 text-lg font-bold"
          :class="seerSays === 'wolf' ? 'text-wolf' : 'text-village'"
          data-testid="seer-result"
        >
          {{ t('play.seerResult', { result: t(`gestures.${seerSays}`) }) }}
        </p>
      </section>

      <section v-if="step.id === 'witch' && witch" class="flex flex-col gap-2">
        <button
          v-if="witch.canSave"
          type="button"
          role="switch"
          :aria-checked="save"
          class="flex min-h-12 items-center gap-2 rounded-xl px-3 font-bold"
          :class="save ? 'bg-green text-bg' : 'bg-surface'"
          data-testid="witch-save"
          @click="((save = !save), (poison = null), (poisonNone = false))"
        >
          <span class="i-tabler-heart-plus size-5" aria-hidden="true" />{{
            t('inputs.save', { n: witch.victim })
          }}
        </button>
        <template v-if="witch.poison && !save">
          <h3 class="text-sm text-subtle">{{ t('inputs.poison') }}</h3>
          <SeatPicker
            v-model="poison"
            v-model:none="poisonNone"
            :none-label="t('inputs.noPoison')"
            :count="count"
            :label="t('inputs.poison')"
            :dead="dead"
          />
        </template>
      </section>

      <p
        v-if="step.id === 'gravekeeper'"
        class="rounded-xl bg-raised p-3 text-lg font-bold"
        data-testid="gravekeeper-result"
      >
        {{
          step.gravekeeper
            ? `${seat(step.gravekeeper.target)}：${t(`gestures.${step.gravekeeper.result}`)}`
            : t('gestures.none')
        }}
      </p>
      <p
        v-if="step.id === 'hunter'"
        class="rounded-xl bg-raised p-3 text-lg font-bold"
        :class="hunterCanShoot ? 'text-green' : 'text-red'"
        data-testid="hunter-status"
      >
        {{ t('play.canShoot', { state: hunterCanShoot ? t('play.shootYes') : t('play.shootNo') }) }}
      </p>

      <section
        v-if="step.id === 'sheriff' || step.id === 'shoot' || step.id === 'badge'"
        class="flex flex-col gap-2"
      >
        <h3 class="text-sm text-subtle">
          {{
            {
              sheriff: t('inputs.sheriff'),
              shoot: t('inputs.shootTarget'),
              badge: t('inputs.badgeTo'),
            }[step.id as string]
          }}
        </h3>
        <SeatPicker
          v-model="target"
          v-model:none="targetNone"
          :none-label="
            (
              {
                sheriff: t('inputs.noSheriff'),
                shoot: t('inputs.noShot'),
                badge: t('inputs.tearBadge'),
              } as Record<string, string>
            )[step.id]
          "
          :count="count"
          :label="t(`steps.${step.id}`)"
          :dead="step.id === 'sheriff' ? outBefore : dead"
          :disabled="step.id === 'shoot' ? [step.shooter!] : []"
        />
      </section>

      <section v-if="step.id === 'day'" class="flex flex-col gap-3">
        <div
          class="flex flex-wrap gap-1 rounded-xl bg-surface p-1"
          role="radiogroup"
          :aria-label="t('inputs.actions')"
        >
          <button
            v-for="a in ['vote', 'explode', 'duel'] as const"
            v-show="
              a === 'vote' ||
              (a === 'explode' && explodable.length) ||
              (a === 'duel' && (step.day!.knight !== null || step.day!.knightUnknown))
            "
            :key="a"
            type="button"
            role="radio"
            :aria-checked="dayAction === a"
            class="min-h-10 flex-1 rounded-lg px-3 text-sm"
            :class="dayAction === a ? 'bg-purple font-bold text-bg' : 'text-muted'"
            :data-testid="`day-${a}`"
            @click="chooseDayAction(a)"
          >
            {{ t(`inputs.${a}`) }}
          </button>
        </div>
        <template v-if="dayAction === 'vote'">
          <SeatPicker
            v-model="target"
            v-model:none="targetNone"
            :none-label="t('inputs.noExile')"
            :count="count"
            :label="t('inputs.vote')"
            :dead="dead"
          />
        </template>
        <template v-else-if="dayAction === 'explode'">
          <h3 class="text-sm text-subtle">{{ t('inputs.explodeWho') }}</h3>
          <SeatPicker
            v-model="actor"
            :count="count"
            :label="t('inputs.explodeWho')"
            :dead="dead"
            :disabled="state.players.filter((p) => !explodable.includes(p.seat)).map((p) => p.seat)"
          />
          <template v-if="explodingRole === 'whiteWolfKing'">
            <h3 class="text-sm text-subtle">{{ t('inputs.blast') }}</h3>
            <SeatPicker
              v-model="blast"
              v-model:none="blastNone"
              :none-label="t('inputs.noBlast')"
              :count="count"
              :label="t('inputs.blast')"
              :dead="dead"
              :disabled="actor === null ? [] : [actor]"
            />
          </template>
        </template>
        <template v-else>
          <template v-if="step.day!.knight === null">
            <h3 class="text-sm text-subtle">{{ t('inputs.knightWho') }}</h3>
            <SeatPicker
              v-model="actor"
              :count="count"
              :label="t('inputs.knightWho')"
              :dead="dead"
              :disabled="notHolder"
            />
          </template>
          <h3 class="text-sm text-subtle">{{ t('inputs.duelTarget') }}</h3>
          <SeatPicker
            v-model="target"
            :count="count"
            :label="t('inputs.duelTarget')"
            :dead="dead"
            :disabled="[step.day!.knight ?? actor ?? 0]"
          />
        </template>
      </section>
    </template>

    <BottomBar>
      <button
        type="button"
        class="w-full flex h-14 items-center justify-center gap-2 rounded-2xl bg-purple text-lg font-bold text-bg disabled:opacity-40"
        :disabled="!valid"
        data-testid="submit"
        @click="submit"
      >
        {{
          ['dusk', 'lovers', 'deaths'].includes(step.id) || step.dead
            ? t('play.next')
            : t('play.confirm')
        }}
        <span class="i-tabler-arrow-right size-6" aria-hidden="true" />
      </button>
    </BottomBar>
  </div>
</template>
