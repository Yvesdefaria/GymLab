// Tab "Rachas" del perfil: racha actual, máxima, último entreno y próximo hito de insignia.
import { useTranslation } from 'react-i18next'
import { Calendar, Flame, Trophy } from 'lucide-react'
import { parseLocalDate } from '@/domain/dates'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { StreakResult } from '@/domain/types'

export const RachasSection = ({ streak }: { streak: StreakResult }) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { currentStreak, longestStreak, lastWorkoutDate } = streak

  // Formatea YYYY-MM-DD a algo legible ("5 de agosto").
  const fmtDate = (dateStr: string) =>
    formatDate(parseLocalDate(dateStr), lang, { day: 'numeric', month: 'long' })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="panel rounded-2xl p-4">
          <Flame className="mb-2 size-5 text-cta" aria-hidden />
          <p className="kicker">{t('perfil.rachaActual')}</p>
          <p className="stat-value text-2xl">{currentStreak > 0 ? t('perfil.dias', { count: currentStreak }) : '—'}</p>
        </div>
        <div className="panel rounded-2xl p-4">
          <Trophy className="mb-2 size-5 text-cta" aria-hidden />
          <p className="kicker">{t('perfil.rachaMaxima')}</p>
          <p className="stat-value text-2xl">{longestStreak > 0 ? t('perfil.dias', { count: longestStreak }) : '—'}</p>
        </div>
      </div>

      {lastWorkoutDate && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Calendar className="size-4 text-accent" aria-hidden />
          {t('perfil.ultimoEntreno')} <strong className="text-fg">{fmtDate(lastWorkoutDate)}</strong>
        </p>
      )}

      {currentStreak > 0 && currentStreak < 30 && (
        <p className="rounded-xl border border-gold/40 bg-cta/10 px-3 py-2 text-xs text-accent-soft">
          {currentStreak < 7
            ? t('perfil.insigniaSemanal', { count: 7 - currentStreak })
            : t('perfil.insigniaMensual', { count: 30 - currentStreak })}
        </p>
      )}
      {currentStreak === 0 && lastWorkoutDate && (
        <p className="text-sm text-muted">
          {t('perfil.rachaRota')}
        </p>
      )}
      {currentStreak === 0 && !lastWorkoutDate && (
        <p className="text-sm text-muted">{t('perfil.rachaEmpezar')}</p>
      )}
    </div>
  )
}
