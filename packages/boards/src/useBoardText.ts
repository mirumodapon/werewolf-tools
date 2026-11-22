import {
  localized,
  type BoardIssue,
  type Locale,
  type Localized,
  type RoleId,
} from '@werewolf/rules'
import { useI18n } from 'vue-i18n'

/** Text for what is stored as ids or in both languages, in the current language. */
export function useBoardText() {
  const { t, locale } = useI18n()
  const lang = () => locale.value as Locale
  const roleName = (id: RoleId) => t(`roles.${id}.name`)
  const boardName = (name: Localized | string) => localized(name, lang()) || t('boards.untitled')

  function issueText(issue: BoardIssue): string {
    const params: Record<string, unknown> = { ...issue }
    if ('role' in issue && issue.code !== 'badCount') params.role = roleName(issue.role)
    return t(`check.${issue.code}`, params)
  }

  function formatDate(ms: number): string {
    return new Intl.DateTimeFormat(lang(), { dateStyle: 'medium', timeStyle: 'short' }).format(ms)
  }

  return { t, lang, roleName, boardName, issueText, formatDate }
}
