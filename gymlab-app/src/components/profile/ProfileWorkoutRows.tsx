// Filas de entrenos del perfil y del historial: fecha, volumen y duración.
// El listado completo pagina con `showMore` y puede agrupar por mes.
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { localDateOf, parseLocalDate } from '@/domain/dates'
import { applyUnits, formatUnits, type Units } from '@/domain/settings'
import { workoutDurationMin } from '@/domain/workouts'
import { volumeOf, type VolumeByWorkout } from '@/domain/volume'
import { formatDate, formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { Workout } from '@/domain/types'

type ProfileWorkoutRowsProps = {
  workouts: Workout[]
  volumes: VolumeByWorkout
  units: Units
  limit?: number
  showMore?: boolean
  onMore?: () => void
  /** Inserta el mes (p. ej. «OCTUBRE 2026») cuando cambia. */
  grouped?: boolean
}

type MonthGroup = { key: string; label: string; items: Workout[] }

export const ProfileWorkoutRows = ({
  workouts,
  volumes,
  units,
  limit = 3,
  showMore = false,
  onMore,
  grouped = false,
}: ProfileWorkoutRowsProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const visible = workouts.slice(0, limit)
  if (visible.length === 0) return null

  const monthLabel = (key: string) =>
    formatDate(parseLocalDate(`${key}-01`), lang, { month: 'long', year: 'numeric' })

  // Agrupa la ventana visible por mes para el historial; el perfil usa una sola lista.
  const groups: MonthGroup[] = []
  for (const workout of visible) {
    const key = localDateOf(workout).slice(0, 7)
    const last = groups[groups.length - 1]
    if (last?.key === key) last.items.push(workout)
    else groups.push({ key, label: monthLabel(key), items: [workout] })
  }

  const renderRow = (workout: Workout) => {
    const durationMin = workoutDurationMin(workout)
    const volume = `${formatNumber(Math.round(applyUnits(volumeOf(workout, volumes), units)), lang)} ${formatUnits(units)}`
    const date = formatDate(parseLocalDate(localDateOf(workout)), lang, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    return (
      <Link
        key={workout.id}
        to={`/entrenamiento/${workout.id}`}
        className="flex min-h-11 items-center justify-between gap-3 py-2"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm capitalize text-fg">{date}</span>
          <span className="mt-0.5 block text-[11px] text-muted">
            {volume}
            {durationMin != null ? t('workout.minSufijo', { min: durationMin }) : ''}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
      </Link>
    )
  }

  return (
    <div>
      <div className="divide-y divide-border/30">
        {groups.map((group) => (
          <div key={group.key}>
            {grouped ? (
              <p className="pt-3 text-[9px] font-medium uppercase tracking-[0.18em] text-muted">
                {group.label}
              </p>
            ) : null}
            <div className="divide-y divide-border/30">{group.items.map(renderRow)}</div>
          </div>
        ))}
      </div>

      {showMore && workouts.length > limit ? (
        <button
          type="button"
          onClick={onMore}
          className="mt-2 min-h-11 w-full rounded-xl border border-border/40 text-xs font-semibold text-fg transition-colors hover:border-cta"
        >
          {t('perfil.verMasEntrenos')}
        </button>
      ) : null}
    </div>
  )
}
