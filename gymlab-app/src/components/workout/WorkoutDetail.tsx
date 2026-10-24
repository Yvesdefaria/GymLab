// F132.2/Q2 — detalle de una sesión guardada: héroe de volumen, stat row y
// bloques hairline. Conserva nota, diario, share, borrado y empty state.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share2, Trash2, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { SessionJournalSummary } from '@/components/journal/SessionJournalSummary'
import { SessionImageExport } from '@/components/session/SessionImageExport'
import { WorkoutExerciseBlock } from '@/components/workout/WorkoutExerciseBlock'
import { WorkoutNotePanel } from '@/components/workout/WorkoutNotePanel'
import { useWorkout } from '@/hooks/useWorkouts'
import { useSettings } from '@/hooks/useSettings'
import { useSessionPhotoData } from '@/hooks/useSessionPhotoData'
import { exerciseRepo, prRepo } from '@/data/repositories'
import { deleteWorkoutSession } from '@/data/workoutDeletion'
import { applyUnits, formatUnits } from '@/domain/settings'
import { workoutDurationMin } from '@/domain/workouts'
import { isCardioCategory } from '@/domain/exerciseCategory'
import { haptics } from '@/lib/haptics'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { Exercise, PRRecord } from '@/domain/types'

type WorkoutDetailProps = {
  workoutId: number
}

// Mapas vacíos con identidad estable mientras cargan las consultas acotadas.
const EMPTY_EXERCISE_BY_ID = new Map<number, Exercise>()
const EMPTY_PR_MAP = new Map<number, PRRecord>()

export const WorkoutDetail = ({ workoutId }: WorkoutDetailProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const navigate = useNavigate()
  const { settings } = useSettings()
  const { workout, sets } = useWorkout(workoutId)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showShare, setShowShare] = useState(false)

  // Borrado permanente (F98.6/R1): confirma, vibra y vuelve al historial. Sin soft-delete.
  const handleDelete = async () => {
    setDeleting(true)
    haptics(200)
    try {
      await deleteWorkoutSession(workoutId)
      navigate('/perfil')
    } finally {
      setDeleting(false)
    }
  }
  // Consultas acotadas a los ejercicios de esta sesión, sin leer tablas completas.
  const exerciseIds = useMemo(() => Array.from(new Set(sets.map((s) => s.exerciseId))), [sets])
  const exerciseById =
    useLiveQuery(
      async () => {
        const exs = await exerciseRepo.getByIds(exerciseIds)
        return new Map(exs.map((e) => [e.id, e]))
      },
      [exerciseIds]
    ) ?? EMPTY_EXERCISE_BY_ID
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
  // Foto de la sesión: PRs derivados por ventana temporal desde la misma fuente
  // que el resumen post-guardado (sin prCount hardcodeado). Reusa el workout/sets
  // ya leídos arriba: una sola suscripción por detalle (F120/S1).
  const photoData = useSessionPhotoData(workout, sets)

  if (!workout) {
    return (
      <div>
        <AppHeader title={t('workout.titulo')} subtitle={t('workout.historial')} />
        <div className="p-4">
          <div className="border-t border-border/40 py-6 text-center">
            <p className="font-display text-base font-medium text-fg">{t('workout.noEncontrada')}</p>
            <p className="mt-1 text-sm text-muted">{t('workout.posibleBorrada')}</p>
            <BackLink
              to="/perfil"
              label={t('workout.volverHistorial')}
              className="mt-4 border border-border px-4"
            />
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
  const prCount = photoData?.prCount ?? 0

  return (
    <div>
      <AppHeader kicker={dateLabel} title={t('workout.titulo')} />
      <div className="space-y-4 p-4 pb-24">
        <BackLink
          to="/perfil"
          label={t('workout.historial')}
          className="min-h-11 gap-1.5 text-muted hover:text-accent-soft"
        />

        <div className="border-b border-border/40 pb-4 pt-1">
          <p className="kicker text-gold">{t('workout.volumenTotal')}</p>
          <p className="mt-1 font-display text-5xl font-light tabular-nums tracking-tight text-fg">
            {Math.round(applyUnits(workout.totalVolume, settings.units)).toLocaleString()}{' '}
            <small className="font-sans text-sm font-normal text-muted">
              {formatUnits(settings.units)}
            </small>
          </p>
          <p className="mt-1 text-[10px] text-muted">{dateLabel}</p>
          {prCount > 0 && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-success/35 bg-success/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-success">
              <Trophy className="size-3" aria-hidden />
              {t('workout.prsResumen', { count: prCount })}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 divide-x divide-border/40 border-y border-border/40 py-3 text-center">
          <div className="px-2">
            <p className="kicker">{t('workout.duracion')}</p>
            <p className="mt-0.5 font-display text-xl font-light tabular-nums text-fg">
              {durationMin !== null ? t('workout.min', { min: durationMin }) : '—'}
            </p>
          </div>
          <div className="px-2">
            <p className="kicker">{t('workout.series')}</p>
            <p className="mt-0.5 font-display text-xl font-light tabular-nums text-fg">
              {completedSets}/{sets.length}
            </p>
          </div>
          <div className="px-2">
            <p className="kicker">{t('workout.ejercicios')}</p>
            <p className="mt-0.5 font-display text-xl font-light tabular-nums text-fg">
              {exerciseIds.length}
            </p>
          </div>
        </div>

        {exerciseIds.length === 0 ? (
          <div className="border-t border-border/40 py-6 text-center">
            <p className="text-sm text-muted">{t('workout.sinEjercicios')}</p>
          </div>
        ) : (
          exerciseIds.map((exerciseId) => {
            const exercise = exerciseById.get(exerciseId)
            const name = exercise?.name ?? t('workout.ejercicioNum', { id: exerciseId })
            const exerciseSets = setsByExercise.get(exerciseId) ?? []
            return (
              <WorkoutExerciseBlock
                key={exerciseId}
                name={name}
                sets={exerciseSets}
                pr={prMap.get(exerciseId)}
                units={settings.units}
                isCardio={isCardioCategory(exercise?.category)}
              />
            )
          })
        )}

        <WorkoutNotePanel key={workoutId} workoutId={workoutId} />

        <SessionJournalSummary workoutId={workoutId} />

        <button
          type="button"
          onClick={() => setShowShare((value) => !value)}
          aria-expanded={showShare}
          className="flex min-h-11 w-full items-center gap-2 border-t border-border/40 text-sm text-fg"
        >
          <Share2 className="size-4 text-gold" aria-hidden />
          <span className="min-w-0 flex-1 text-left">{t('workout.compartirComoImagen')}</span>
          <span className="text-[10px] text-muted">{showShare ? '−' : '+'}</span>
        </button>
        {showShare && photoData && (
          <div className="pt-2">
            <SessionImageExport data={photoData} />
          </div>
        )}

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="flex min-h-11 w-full items-center justify-center gap-2 border-t border-border/40 text-sm text-danger"
        >
          <Trash2 className="size-4" aria-hidden />
          {t('workout.eliminarSesion')}
        </button>
      </div>

      {confirmOpen && (
        <ConfirmSheet
          title={t('workout.eliminarSesionTitulo')}
          message={t('workout.eliminarSesionMensaje')}
          confirmLabel={t('workout.eliminarSesion')}
          destructive
          busy={deleting}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
