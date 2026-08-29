// Tarjeta «Último registro» de grasa corporal: % recalculado y fecha + n.º de pliegues guardados.
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
    <section className="panel-light rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('grasa.ultimoRegistro')}
        </h2>
        <span className="font-display font-semibold text-fg">{latestPct}%</span>
      </div>
      <p className="text-xs text-muted">
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