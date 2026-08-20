// Bloque de ejercicio dentro de la sesión activa: cabecera con PR y sugerencia de carga, y lista de series.
// Para ejercicios cardio muestra CardioTracker con GPS/acelerómetro; para fuerza muestra SetRow tradicional.
import { useState } from 'react'
import { CheckCheck, Plus, Sparkles, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SetRow } from './SetRow'
import { CardioTracker } from './CardioTracker'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import type { ActiveExercise, ActiveSet } from '@/store/activeWorkoutStore'
import type { Units } from '@/domain/settings'
import { formatWeight, formatUnits } from '@/domain/settings'
import { useLoadSuggestion } from '@/hooks/useLoadSuggestion'
import { useBodyWeight } from '@/hooks/useBodyWeight'
import { isPR } from '@/domain/prs'
import { metValues } from '@/domain/cardio'

// Resuelve el valor MET del ejercicio a partir del slug.
const resolveMet = (slug: string): number => {
  const s = slug.toLowerCase()
  if (s.includes('running') || s.includes('correr')) return metValues.running
  if (s.includes('bicycling') || s.includes('bike') || s.includes('bici')) return metValues.cycling
  if (s.includes('rowing') || s.includes('remo')) return metValues.rowing
  if (s.includes('swimming') || s.includes('natación')) return metValues.swimming
  if (s.includes('rope') || s.includes('cuerda') || s.includes('jump')) return metValues.jumping_rope
  if (s.includes('elliptical') || s.includes('elíptica')) return metValues.elliptical
  if (s.includes('walking') || s.includes('camin')) return metValues.walking
  if (s.includes('stair') || s.includes('escal')) return metValues.stair_climbing
  if (s.includes('boxing') || s.includes('boxeo')) return metValues.boxing
  return metValues.generic
}

type ExerciseBlockProps = {
  exercise: ActiveExercise
  prMap: Map<number, { weightKg: number; reps: number; estimated1RM: number }>
  showRpe?: boolean
  showRir?: boolean
  units: Units
  isCardio?: boolean
  exerciseSlug?: string
  note?: string
  onCompleteExercise?: () => void
  onSetCompleted?: (set: ActiveSet, completed: boolean) => void
  onRemoveRequest?: (exerciseId: number) => void
  onSetRemoveRequest?: (exerciseId: number, setId: string) => void
}

export const ExerciseBlock = ({
  exercise,
  prMap,
  showRpe,
  showRir,
  units,
  isCardio,
  exerciseSlug,
  note,
  onCompleteExercise,
  onSetCompleted,
  onRemoveRequest,
  onSetRemoveRequest,
}: ExerciseBlockProps) => {
  const { t } = useTranslation()
  const addSet = useActiveWorkoutStore((s) => s.addSet)
  const removeSet = useActiveWorkoutStore((s) => s.removeSet)
  const updateSet = useActiveWorkoutStore((s) => s.updateSet)
  const removeExercise = useActiveWorkoutStore((s) => s.removeExercise)
  const pr = prMap.get(exercise.exerciseId)
  const allDone = exercise.sets.length > 0 && exercise.sets.every((s) => s.completed)
  const { today: bodyWeight } = useBodyWeight()
  const [showManualCardio, setShowManualCardio] = useState(false)

  const { suggestion, enabled } = useLoadSuggestion(exercise.exerciseId, pr?.weightKg ?? 0)
  const nextSet = exercise.sets.find((s) => !s.completed && !s.isWarmup)
  const canSuggest = enabled && suggestion > 0 && !!nextSet && suggestion !== nextSet.weightKg

  const weightKg = bodyWeight?.weightKg ?? 70
  const met = resolveMet(exerciseSlug ?? exercise.exerciseName)

  const handleCardioFinish = (data: { durationSeconds: number; distanceMeters: number }) => {
    const targetSet = exercise.sets[0]
    if (targetSet) {
      updateSet(exercise.exerciseId, targetSet.id, {
        durationSeconds: data.durationSeconds,
        distanceMeters: data.distanceMeters,
        completed: true,
      })
    }
    onCompleteExercise?.()
  }

  return (
    <div className="panel-light rounded-2xl p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-semibold text-fg">
            {exercise.exerciseName}
          </h3>
          {exercise.supersetGroup && (
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-cta">
              {t('workout.superserie', { grupo: exercise.supersetGroup })}
            </p>
          )}
          {pr && (
            <p className="text-xs text-muted">
              {t('workout.prTexto', {
                peso: formatWeight(pr.weightKg, units),
                reps: pr.reps,
                e1rm: formatWeight(pr.estimated1RM, units),
              })}
            </p>
          )}
          {canSuggest && nextSet && (
            <button
              type="button"
              onClick={() => updateSet(exercise.exerciseId, nextSet.id, { weightKg: suggestion })}
              className="mt-1.5 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-cta/40 bg-cta/10 px-2.5 text-xs font-medium text-accent-soft transition-colors hover:border-cta"
              aria-label={t('workout.aplicarPesoSugerido', { peso: formatWeight(suggestion, units) })}
            >
              <Sparkles className="size-3.5" aria-hidden />
              {t('workout.sugerido', { peso: formatWeight(suggestion, units) })}
            </button>
          )}
          {note && <p className="mt-1 text-xs italic text-muted">{t('workout.nota', { nota: note })}</p>}
        </div>
        <div className="flex shrink-0 gap-1">
          {onCompleteExercise && !allDone ? (
            <button
              type="button"
              onClick={onCompleteExercise}
              className="flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-xs text-success transition-colors hover:bg-success/10"
              aria-label={t('workout.finalizarEjercicio')}
            >
              <CheckCheck className="size-4" />
              {t('workout.listo')}
            </button>
          ) : null}
          <button
            onClick={() => (onRemoveRequest ? onRemoveRequest(exercise.exerciseId) : removeExercise(exercise.exerciseId))}
            className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors hover:text-danger"
            aria-label={t('workout.eliminarEjercicio')}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Cardio: tracker GPS/acelerómetro ── */}
      {isCardio && !showManualCardio ? (
        <>
          <CardioTracker
            exerciseMet={met}
            weightKg={weightKg}
            onFinish={handleCardioFinish}
          />
          <button
            type="button"
            onClick={() => setShowManualCardio(true)}
            className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-xs text-muted transition-colors hover:border-accent hover:text-accent-soft"
          >
            {t('workout.inputManual')}
          </button>
        </>
      ) : (
        <>
          {/* ── Fuerza (o cardio manual): SetRow tradicional ── */}
          <div className="mb-2 flex items-center gap-2 kicker">
            <span className="w-8 shrink-0 text-center">{t('workout.set')}</span>
            <span className="w-16 text-center">{t('workout.peso', { unidad: formatUnits(units) })}</span>
            <span className="w-14 text-center">{t('workout.reps')}</span>
            {showRpe && <span className="w-12 text-center">{t('workout.rpe')}</span>}
            {showRir && <span className="w-12 text-center">{t('workout.rir')}</span>}
            <span className="size-10 shrink-0" />
            <span className="size-10 shrink-0" />
            <span className="size-12" />
          </div>

          <div className="space-y-2">
            {exercise.sets.map((set) => (
              <SetRow
                key={set.id}
                set={set}
                showRpe={showRpe}
                showRir={showRir}
                units={units}
                isCardio={isCardio}
                isPR={pr ? isPR(set.weightKg, set.reps, pr) : false}
                onUpdate={(changes) => updateSet(exercise.exerciseId, set.id, changes)}
                onRemove={() =>
                  onSetRemoveRequest
                    ? onSetRemoveRequest(exercise.exerciseId, set.id)
                    : removeSet(exercise.exerciseId, set.id)
                }
                onComplete={(completed) => onSetCompleted?.(set, completed)}
              />
            ))}
          </div>

          <button
            onClick={() => addSet(exercise.exerciseId)}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gold/40 text-sm text-muted transition-colors hover:border-cta hover:text-accent-soft"
          >
            <Plus className="size-4" />
            {t('workout.anadirSerie')}
          </button>
        </>
      )}
    </div>
  )
}
