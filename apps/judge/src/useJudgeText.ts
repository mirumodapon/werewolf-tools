import { useBoardText } from '@werewolf/boards'
import type { LogEntry, RoleId } from '@werewolf/rules'
import { useI18n } from 'vue-i18n'
import { autoNameParts, type JudgeGame } from './games/game.ts'

/** Seats, game names, script lines and timeline entries in the current language. */
export function useJudgeText() {
  const base = useBoardText()
  const { t, tm, rt } = useI18n()
  const seat = (n: number) => t('common.seat', { n })
  const seats = (list: readonly number[]) =>
    list.map(seat).join(base.lang() === 'zh-TW' ? '、' : ', ')
  const gameName = (g: Pick<JudgeGame, 'name' | 'createdAt' | 'seq'>) =>
    g.name || t('list.autoName', autoNameParts(g))

  /** A list of script lines (`script.<key>` is an array). */
  const lines = (key: string, params: Record<string, unknown> = {}) =>
    (tm(key) as unknown as Parameters<typeof rt>[0][]).map((m) => rt(m, params))

  function logText(e: LogEntry): string {
    const s = (n: number | null) => (n === null ? t('common.none') : seat(n))
    switch (e.kind) {
      case 'lovers':
        return t('log.lovers', { a: seat(e.seats[0]), b: seat(e.seats[1]) })
      case 'model':
        return t('log.model', {
          role: base.roleName(e.role),
          seat: seat(e.seat),
          target: seat(e.target),
        })
      case 'swap':
        return t('log.swap', { a: seat(e.seats[0]), b: seat(e.seats[1]) })
      case 'guard':
        return e.target === null ? t('log.guardNone') : t('log.guard', { target: seat(e.target) })
      case 'kill':
        return e.target === null ? t('log.killNone') : t('log.kill', { target: seat(e.target) })
      case 'charm':
        return e.target === null ? t('log.charmNone') : t('log.charm', { target: seat(e.target) })
      case 'save':
        return t('log.save', { target: seat(e.target) })
      case 'poison':
        return t('log.poison', { target: seat(e.target) })
      case 'check':
        return t('log.check', { target: seat(e.target), result: t(`log.${e.result}`) })
      case 'gravekeeper':
        return t('log.gravekeeper', { target: seat(e.target), result: t(`log.${e.result}`) })
      case 'curse':
        return e.target === null ? t('log.curseNone') : t('log.curse', { target: seat(e.target) })
      case 'announce':
        return e.seats.length
          ? t('log.announce', { seats: seats(e.seats) })
          : t('log.announcePeace')
      case 'death':
        return t('log.death', { seat: seat(e.seat), cause: t(`causes.${e.cause}`) })
      case 'turned':
        return t('log.turned', { seat: seat(e.seat) })
      case 'sheriff':
        return e.seat === null ? t('log.sheriffNone') : t('log.sheriff', { seat: seat(e.seat) })
      case 'badge':
        return e.to === null
          ? t('log.badgeTorn', { from: seat(e.from) })
          : t('log.badge', { from: seat(e.from), to: seat(e.to) })
      case 'shoot':
        return e.target === null
          ? t('log.shootNone', { seat: seat(e.seat) })
          : t('log.shoot', { seat: seat(e.seat), target: s(e.target) })
      case 'exile':
        return e.seat === null ? t('log.exileNone') : t('log.exile', { seat: seat(e.seat) })
      case 'idiot':
        return t('log.idiot', { seat: seat(e.seat) })
      case 'explode':
        return e.target === null
          ? t('log.explode', { seat: seat(e.seat) })
          : t('log.explodeTake', { seat: seat(e.seat), target: seat(e.target) })
      case 'duel':
        return t(e.success ? 'log.duelWin' : 'log.duelLose', {
          seat: seat(e.seat),
          target: seat(e.target),
        })
      case 'assign':
        return t('log.assign', { seat: seat(e.seat), role: base.roleName(e.role as RoleId) })
      case 'end':
        return t(e.manual ? 'log.endManual' : 'log.end', { winner: t(`winners.${e.winner}`) })
    }
  }

  return { ...base, t, seat, seats, gameName, lines, logText }
}
