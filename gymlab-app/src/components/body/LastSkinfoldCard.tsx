// «Último registro» de grasa corporal: % recalculado, fecha y cantidad de pliegues.
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { SkinfoldEntry } from '@/domain/types'

interface LastSkinfoldCardProps {
  latest: SkinfoldEntry
  latestPct: number
}

export const LastSkinfoldCard = ({ latest, latestPct }: LastSkinfoldCardProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage

  return (
    <section className="border-t border-border/40 pt-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t('grasa.ultimoRegistro')}
        </h2>
        <span className="font-display text-xl font-light tabular-nums text-fg">{latestPct}%</span>
      </div>
      <p className="mt-1 text-[10px] text-muted">
        {formatDate(latest.localDate + 'T12:00:00', lang, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })}
        {' · '}
        {t('grasa.plieguesGuardados', {
          count: latest.sites ? Object.keys(latest.sites).length : 0,
        })}
      </p>
    </section>
  )
}
