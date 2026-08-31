// Tab "Rachas" del perfil (F93 #4): hero con racha actual/máxima, grid de los últimos
// 30 días con los días entrenados y progreso hacia la siguiente insignia de racha.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, Flame, Trophy } from 'lucide-react'
import { parseLocalDate } from '@/domain/dates'
import { formatDate } from '@/lib/intl'
import { trainedLocalDates } from '@/domain/calendar'
import { buildThirtyDayGrid, nextStreakBadge } from '@/domain/streak'
import type { AppLanguage } from '@/domain/onboarding'
import type { StreakResult, Workout } from '@/domain/types'

export const RachasSection = ({ streak, workouts }: { streak: StreakResult; workouts: Workout[] }) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { currentStreak, longestStreak, lastWorkoutDate } = streak

  const grid = useMemo(
    () => buildThirtyDayGrid(trainedLocalDates(workouts)),
    [workouts],
  )
  const badge = nextStreakBadge(currentStreak)
  // Progreso del hito actual: días acumulados sobre el total (semana 7, mes 30, centenar 100).
  const badgeProgress = badge
    ? { label: t(`perfil.insignia${badge.target === 100 ? 'Centenar' : badge.target === 30 ? 'Mensual' : 'Semanal'}`, { count: badge.remaining }),
        pct: Math.min(100, Math.round((currentStreak / badge.target) * 100)) }
    : null

  // Formatea YYYY-MM-DD a algo legible ("5 de agosto").
  const fmtDate = (dateStr: string) =>
    formatDate(parseLocalDate(dateStr), lang, { day: 'numeric', month: 'long' })

  return (
    <div className="space-y-3">
      <div className="panel-hero rounded-3xl p-5">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-cta/20 text-cta">
            <Flame className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="kicker">{t('perfil.rachaActual')}</p>
            <p className="font-display text-3xl font-bold leading-none text-fg">
              {currentStreak > 0 ? t('perfil.dias', { count: currentStreak }) : '—'}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="kicker">{t('perfil.rachaMaxima')}</p>
            <p className="flex items-center justify-end gap-1 font-display text-xl font-semibold text-accent-soft">
              <Trophy className="size-4" aria-hidden />
              {longestStreak > 0 ? t('perfil.dias', { count: longestStreak }) : '—'}
            </p>
          </div>
        </div>
      </div>

      <section className="panel-light rounded-2xl p-4">
        <p className="kicker mb-3">{t('perfil.ultimosDias')}</p>
        <div
          role="img"
          aria-label={t('perfil.ultimosDias')}
          className="grid grid-cols-10 gap-1"
        >
          {grid.map((cell) => (
            <span
              key={cell.date}
              aria-label={
                cell.trained
                  ? t('perfil.diaEntrenado', { fecha: fmtDate(cell.date) })
                  : t('perfil.diaSinEntreno', { fecha: fmtDate(cell.date) })
              }
              className={`aspect-square rounded-[4px] ${
                cell.trained ? 'bg-cta' : 'bg-border/25'
              }`}
            />
          ))}
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Calendar className="size-4 text-accent" aria-hidden />
          {lastWorkoutDate
            ? t('perfil.ultimoEntreno', { fecha: fmtDate(lastWorkoutDate) })
            : t('perfil.rachaEmpezar')}
        </p>
      </section>

      {badgeProgress && (
        <section className="rounded-xl border border-gold/40 bg-cta/10 px-3 py-3">
          <p className="text-xs text-accent-soft">{badgeProgress.label}</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border/30" role="progressbar" aria-valuenow={badgeProgress.pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-cta" style={{ width: `${badgeProgress.pct}%` }} />
          </div>
        </section>
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