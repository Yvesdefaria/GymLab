// Héroe del perfil: racha actual en semanas, máximo histórico, tira de 30 días
// y el pie con la próxima insignia (o el último entreno si ya no hay hito).
import { useTranslation } from 'react-i18next'
import { Medal } from 'lucide-react'
import { trainedLocalDates } from '@/domain/calendar'
import { parseLocalDate, toLocalDateStr } from '@/domain/dates'
import { countActiveDays, streakBadge } from '@/domain/profile'
import { buildThirtyDayGrid } from '@/domain/streak'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { StreakResult, Workout } from '@/domain/types'

type HeroWorkout = Pick<Workout, 'localDate' | 'startedAt' | 'finishedAt'>

type ProfileStreakHeroProps = {
  streak: StreakResult
  workouts: readonly HeroWorkout[]
  /** Fecha de referencia para la ventana de 30 días; inyectable en tests. */
  today?: string
}

export const ProfileStreakHero = ({
  streak,
  workouts,
  today = toLocalDateStr(),
}: ProfileStreakHeroProps) => {
  const { t, i18n } = useTranslation()
  // Sin entrenos no hay racha que mostrar: la página usa un empty state honesto.
  if (workouts.length === 0) return null

  const lang = i18n.language as AppLanguage
  const { currentStreak, longestStreak, lastWorkoutDate } = streak
  const trained = trainedLocalDates([...workouts])
  const grid = buildThirtyDayGrid(trained, today)
  const activeDays = countActiveDays(trained, today)
  const badge = streakBadge(currentStreak)
  const foot = badge
    ? t(badge.key, { count: badge.remaining })
    : currentStreak === 0
      ? t('perfil.rachaRota')
      : lastWorkoutDate
        ? t('perfil.ultimoEntreno', {
            fecha: formatDate(parseLocalDate(lastWorkoutDate), lang, {
              day: 'numeric',
              month: 'long',
            }),
          })
        : t('perfil.rachaEmpezar')

  return (
    <section className="pb-4 pt-4">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="kicker">{t('perfil.rachaActual')}</p>
          <p className="mt-1.5 font-display text-[62px] font-light leading-none tabular-nums text-fg">
            {currentStreak}
            <span className="ml-1 text-sm font-medium text-muted">
              {t('perfil.semanasUnidad', { count: currentStreak })}
            </span>
          </p>
        </div>
        <div className="shrink-0 pb-1 text-right">
          <p className="font-display text-2xl font-light tabular-nums text-fg">{longestStreak}</p>
          <p className="text-[9px] uppercase tracking-[0.12em] text-muted">
            {t('perfil.maxAbrev')}
          </p>
        </div>
      </div>

      {/* Tira decorativa: el resumen accesible va en el pie («N / 30 días»). */}
      <div className="mt-3 grid grid-cols-10 gap-1.5" aria-hidden="true">
        {grid.map((cell) => (
          <span
            key={cell.date}
            className={`aspect-square rounded-[4px] ${
              cell.trained ? 'bg-cta' : 'bg-border/25'
            } ${cell.date === today ? 'ring-1 ring-inset ring-gold-bright' : ''}`}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-muted">
        <span className="flex min-w-0 items-center gap-1.5">
          {badge ? <Medal className="size-3.5 shrink-0" aria-hidden /> : null}
          <span className="truncate">{foot}</span>
        </span>
        <span className="shrink-0">{t('perfil.diasActivos', { activos: activeDays })}</span>
      </div>
    </section>
  )
}
