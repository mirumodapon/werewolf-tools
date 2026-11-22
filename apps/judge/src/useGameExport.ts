import { optionsFor, resolveOptions, type LogEntry } from '@werewolf/rules'
import { derive, type JudgeGame } from './games/game.ts'
import { useJudgeText } from './useJudgeText.ts'

export type Tone = 'death' | 'end' | 'muted'

/** A game laid out for export; the text and the image are both drawn from it. */
export interface ExportDoc {
  title: string
  sections: { title: string; lines: { text: string; tone?: Tone }[] }[]
}

/** Builds the export of a game in the current language: header, seats, timeline. */
export function useGameExport() {
  const { t, gameName, boardName, formatDate, roleName, seat, logText } = useJudgeText()

  function settingsLine(game: JudgeGame): string {
    const r = game.board.rules
    return [
      t(`rules.win.${r.win}`),
      `${t('rules.guardSaveConflict.label')}：${t(`rules.guardSaveConflict.${r.guardSaveConflict}`)}`,
      `${t('rules.sheriff.label')}：${t(r.sheriff ? 'rules.sheriff.on' : 'rules.sheriff.off')}`,
      t(`rules.lastWords.${r.lastWords}`),
    ].join(' · ')
  }

  function optionLines(game: JudgeGame): string[] {
    const values = resolveOptions(game.options) as unknown as Record<string, boolean | string>
    return optionsFor(game.board.roles).map((o) => {
      const v = values[o.id]
      const shown =
        o.kind === 'choice'
          ? t(`options.items.${o.id}.choices.${v}`)
          : t(v ? 'options.on' : 'options.off')
      return `${t(`options.items.${o.id}.label`)}：${shown}`
    })
  }

  function build(game: JudgeGame): ExportDoc {
    const { state } = derive(game)
    const header = [
      {
        text: `${formatDate(game.createdAt)} · ${boardName(game.board.name)} · ${t('common.players', { n: state.players.length })}`,
      },
      {
        text: `${t('detail.winner')}：${state.winner ? t(`winners.${state.winner}`) : t('detail.ongoing')}`,
        tone: 'end' as const,
      },
      { text: `${t('rules.title')}：${settingsLine(game)}`, tone: 'muted' as const },
      ...optionLines(game).map((text) => ({ text, tone: 'muted' as const })),
      ...(game.note ? [{ text: `${t('detail.note')}：${game.note}` }] : []),
    ]
    const seats = state.players.map((p) => {
      const marks = [
        state.sheriff === p.seat ? t('seats.sheriff') : '',
        state.lovers?.includes(p.seat) ? t('seats.lover') : '',
      ].filter(Boolean)
      const fate = p.death
        ? `${t(`causes.${p.death.cause}`)}（${t(`detail.rounds.${p.death.phase}`, { n: p.death.round })}）`
        : t('seats.alive')
      return {
        text: `${seat(p.seat)}　${p.role ? roleName(p.role) : t('seats.unknown')}　${fate}${marks.length ? `　${marks.join('、')}` : ''}`,
        tone: p.alive ? undefined : ('death' as const),
      }
    })
    const rounds: ExportDoc['sections'] = []
    let key = ''
    for (const e of state.log as LogEntry[]) {
      const k = `${e.round}-${e.phase}`
      if (k !== key) {
        rounds.push({ title: t(`detail.rounds.${e.phase}`, { n: e.round }), lines: [] })
        key = k
      }
      rounds.at(-1)!.lines.push({
        text: logText(e),
        tone: e.kind === 'death' ? 'death' : e.kind === 'end' ? 'end' : undefined,
      })
    }
    return {
      title: gameName(game),
      sections: [
        { title: '', lines: header },
        { title: t('seats.title'), lines: seats },
        ...rounds,
      ],
    }
  }

  /** Plain text, for messages and notes. */
  function text(game: JudgeGame): string {
    const doc = build(game)
    const out = [doc.title]
    for (const s of doc.sections) {
      out.push('')
      if (s.title) out.push(`【${s.title}】`)
      for (const l of s.lines) out.push(l.text)
    }
    return `${out.join('\n')}\n`
  }

  return { build, text }
}
