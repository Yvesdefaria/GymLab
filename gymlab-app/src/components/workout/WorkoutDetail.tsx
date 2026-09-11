// Página de detalle de una sesión del historial: resumen, notas y series agrupadas por ejercicio.
import { useMemo } from 'react'
import { Clock, Dumbbell, Flame } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { SessionJournalSummary } from '@/components/journal/SessionJournalSummary'
import { SessionImageExport } from '@/components/session/SessionImageExport'
import { WorkoutExerciseBlock } from '@/components/workout/WorkoutExerciseBlock'
import { useWorkout } from '@/hooks/useWorkouts'
import { useSettings } from '@/hooks/useSettings'
import { exerciseRepo, prRepo } from '@/data/repositories'
import { applyUnits, formatUnits } from '@/domain/settings'
import { workoutDurationMin } from '@/domain/workouts'
import { prepareSessionImage } from '@/domain/sessionImage'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { PRRecord } from '@/domain/types'

type WorkoutDetailProps = {
  workoutId: number
}

// Mapas vacíos con identidad estable mientras cargan las consultas acotadas.
const EMPTY_NAME_BY_ID = new Map<number, string>()
const EMPTY_PR_MAP = new Map<number, PRRecord>()

export const WorkoutDetail = ({ workoutId }: WorkoutDetailProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { settings } = useSettings()
  const { workout, sets } = useWorkout(workoutId)
  // Consultas acotadas a los ejercicios de esta sesión, sin leer tablas completas.
  const exerciseIds = useMemo(() => Array.from(new Set(sets.map((s) => s.exerciseId))), [sets])
  const nameById =
    useLiveQuery(
      async () => {
        const exs = await exerciseRepo.getByIds(exerciseIds)
        return new Map(exs.map((e) => [e.id, e.name]))
      },
      [exerciseIds]
    ) ?? EMPTY_NAME_BY_ID
  const prMap =
    useLiveQuery(
      async () => {
        const prs = await Promise.all(exerciseIds.map((id) => prRepo.getByExercise(id)))
        const map = new Map<number, PRRecord>()
        for (const pr of prs) {
          if (pr) map.set(pr.exerciseId, pr)
        }
        return map
      },
      [exerciseIds]
    ) ?? EMPTY_PR_MAP

  if (!workout) {
    return (
      <div>
        <AppHeader title={t('workout.titulo')} subtitle={t('workout.historial')} />
        <div className="p-4">
          <div className="rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 p-8 text-center">
            <p className="font-display text-base font-semibold text-fg">{t('workout.noEncontrada')}</p>
            <p className="mt-1 text-sm text-muted">{t('workout.posibleBorrada')}</p>
            <BackLink to="/perfil" label={t('workout.volverHistorial')} className="mt-4 border border-border bg-bg-elevated px-4 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  const dateLabel = formatDate(workout.startedAt, lang, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const durationMin = workoutDurationMin(workout)
  const completedSets = sets.filter((s) => s.completed).length
  // Agrupa las series por ejercicio conservando el orden de aparición en la sesión.
  const setsByExercise = new Map<number, typeof sets>()
  for (const s of sets) {
    const list = setsByExercise.get(s.exerciseId) ?? []
    list.push(s)
    setsByExercise.set(s.exerciseId, list)
  }

  return (
    <div>
      <AppHeader title={t('workout.titulo')} subtitle={dateLabel} />
      <div className="space-y-4 p-4">
        <BackLink to="/perfil" label={t('workout.historial')} className="min-h-[44px] gap-1.5 text-muted hover:text-accent-soft" />

        <div className="grid grid-cols-3 gap-3">
          <div className="panel rounded-2xl p-3">
            <Clock className="mb-2 size-5 text-muted" />
            <p className="kicker">{t('workout.duracion')}</p>
            <p className="font-display text-lg font-bold text-fg">
              {durationMin !== null ? t('workout.min', { min: durationMin }) : '—'}
            </p>
          </div>
          <div className="panel rounded-2xl p-3">
            <Flame className="mb-2 size-5 text-cta" />
            <p className="kicker">{t('workout.volumen')}</p>
            <p className="font-display text-lg font-bold text-fg">
              {Math.round(applyUnits(workout.totalVolume, settings.units)).toLocaleString()} {formatUnits(settings.units)}
            </p>
          </div>
          <div className="panel rounded-2xl p-3">
            <Dumbbell className="mb-2 size-5 text-accent" />
            <p className="kicker">{t('workout.series')}</p>
            <p className="font-display text-lg font-bold text-fg">
              {completedSets}/{sets.length}
            </p>
          </div>
        </div>

        <SessionImageExport
          data={prepareSessionImage(workout, sets, nameById, 0)}
        />

        {workout.notes && (
          <div className="panel-light rounded-2xl p-4">
            <p className="text-sm leading-relaxed text-fg">{workout.notes}</p>
          </div>
        )}

        <SessionJournalSummary workoutId={workoutId} />

        {exerciseIds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 p-8 text-center">
            <p className="text-sm text-muted">{t('workout.sinEjercicios')}</p>
          </div>
        ) : (
          exerciseIds.map((exerciseId) => {
            const name = nameById.get(exerciseId) ?? t('workout.ejercicioNum', { id: exerciseId })
            const exerciseSets = setsByExercise.get(exerciseId) ?? []
            return (
              <WorkoutExerciseBlock
                key={exerciseId}
                name={name}
                sets={exerciseSets}
                pr={prMap.get(exerciseId)}
                units={settings.units}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
