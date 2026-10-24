// F132.2/B2 — bloque de ejercicio de la sesión activa: cabecera con PR pill y
// acciones en ⋯, tabla de series de una línea (RPE/RIR opcionales), sugerencias
// del día/en vivo y calentamiento/deload. La lógica de foco y registro se conserva.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MoreHorizontal, Plus, Sparkles, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SetRow } from './SetRow'
import { ExerciseActionsSheet } from './ExerciseActionsSheet'
import { setTableColumns } from './setTableColumns'
import { SuggestionChip } from './SuggestionChip'
import { CardioTracker } from './CardioTracker'
import type { SessionSuggestion } from '@/domain/sessionSuggestions'
import { TechniqueChecklist } from '@/components/session/TechniqueChecklist'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import type { ActiveSet } from '@/store/activeWorkoutStore'
import type { Units } from '@/domain/settings'
import type { BodyWeightEntry } from '@/domain/types'
import { formatWeight, formatUnits } from '@/domain/settings'
import type { DayProposal } from '@/domain/workingProgression'
import { isPR } from '@/domain/prs'
import { buildSetInputOrder, nextSetInput, setInputKey } from '@/domain/setInputChain'
import type { SetField, SetInputRef } from '@/domain/setInputChain'
import { metForSlug } from '@/domain/cardio'
import { deloadSuggestedWeight } from '@/domain/deload'

type ExerciseBlockProps = {
  exerciseId: number
  prMap: Map<number, { weightKg: number; reps: number; estimated1RM: number }>
  showRpe?: boolean
  showRir?: boolean
  units: Units
  isCardio?: boolean
  exerciseSlug?: string
  note?: string
  // Ajustes de sugerencia de carga leídos UNA vez a nivel de página (F120/CAR-2): cada
  // bloque deja de abrir su propia liveQuery de settings.
  showLoadSuggestion: boolean
  // F122: propuesta del día (escalada/consolidando) calculada una vez a nivel de página;
  // ausente = silencio (sin evidencia o sin nada que proponer).
  dayProposal?: DayProposal
  onApplyEscalada?: (exerciseId: number, weightsKg: number[]) => void
  // Muestra el peso reducido sugerido por serie cuando la semana de deload está activa.
  deloadActive?: boolean
  // Peso corporal de hoy: se consulta UNA vez a nivel de página y se reparte a todos los bloques (tarea 91.2).
  bodyWeight?: BodyWeightEntry
  // Promedio de top set de las últimas N sesiones (F97.4), leído una vez a nivel de página.
  recentTopSetAvgKg?: number
  // Sugerencia en vivo de ESTE bloque (F98.2), ya estabilizada por referencia a nivel de página.
  // Se llama `liveSuggestion` para no chocar con el "Sugerido" del motor (useLoadSuggestion).
  liveSuggestion?: SessionSuggestion
  onSuggestionApply?: (exerciseId: number, amountKg: number) => void
  onSuggestionWarmup?: (exerciseId: number, warmupWeightKg: number) => void
  onCompleteExercise?: (exerciseId: number) => void
  onSetCompleted?: (exerciseId: number, setId: string, completed: boolean) => void
  onRemoveRequest?: (exerciseId: number) => void
  onSetRemoveRequest?: (exerciseId: number, setId: string) => void
}

export const ExerciseBlock = memo(({
  exerciseId,
  prMap,
  showRpe,
  showRir,
  units,
  isCardio,
  exerciseSlug,
  note,
  showLoadSuggestion,
  dayProposal,
  onApplyEscalada,
  deloadActive,
  bodyWeight,
  recentTopSetAvgKg,
  liveSuggestion,
  onSuggestionApply,
  onSuggestionWarmup,
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
  // Selector fino por ejercicio: solo se re-renderiza cuando cambian LAS SERIES de ESTE ejercicio.
  const exercise = useActiveWorkoutStore((s) => s.exercises.find((e) => e.exerciseId === exerciseId))
  const [showManualCardio, setShowManualCardio] = useState(false)
  const [showTechnique, setShowTechnique] = useState(false)
  const [showActions, setShowActions] = useState(false)

  // Cadena de foco (F98.4): registro de refs por `${setId}:${field}`. El orden se
  // deriva de las series y del modo fuerza, nunca del DOM, así el rediseño 98.5
  // no puede romperlo. Los callbacks son estables para no vencer el memo de SetRow.
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const forceMode = !isCardio && Boolean(showRpe || showRir)
  const order = useMemo(
    () => buildSetInputOrder(exercise?.sets ?? [], forceMode),
    [exercise?.sets, forceMode]
  )
  const orderRef = useRef(order)
  useEffect(() => {
    orderRef.current = order
  })

  const registerInput = useCallback(
    (setId: string, field: SetField, el: HTMLInputElement | null) => {
      const key = setInputKey(setId, field)
      if (el) inputRefs.current.set(key, el)
      else inputRefs.current.delete(key)
    },
    []
  )

  // Enter: salta al siguiente input registrado de la cadena; si no hay, hace blur
  // (último input de la última serie). El predicado salta campos no renderizados.
  const handleSetEnter = useCallback((setId: string, field: SetField) => {
    const isFocusable = (ref: SetInputRef) =>
      inputRefs.current.has(setInputKey(ref.setId, ref.field))
    const next = nextSetInput(orderRef.current, { setId, field }, isFocusable)
    if (next) inputRefs.current.get(setInputKey(next.setId, next.field))?.focus()
    else inputRefs.current.get(setInputKey(setId, field))?.blur()
  }, [])

  const pr = prMap.get(exerciseId)

  // Handlers estables identificando cada serie por ids: el memo de SetRow depende de que
  // estas props no cambien de referencia entre renders (tarea 91.2).
  const handleCardioFinish = useCallback((data: { durationSeconds: number; distanceMeters: number }) => {
    const current = useActiveWorkoutStore.getState().exercises.find((e) => e.exerciseId === exerciseId)
    const targetSet = current?.sets[0]
    if (targetSet) {
      updateSet(exerciseId, targetSet.id, {
        durationSeconds: data.durationSeconds,
        distanceMeters: data.distanceMeters,
        completed: true,
      })
    }
    onCompleteExercise?.(exerciseId)
  }, [exerciseId, updateSet, onCompleteExercise])

  const handleAddSet = useCallback(() => addSet(exerciseId), [addSet, exerciseId])

  const handleRemoveExercise = useCallback(
    () => (onRemoveRequest ? onRemoveRequest(exerciseId) : removeExercise(exerciseId)),
    [onRemoveRequest, removeExercise, exerciseId]
  )

  const handleUpdate = useCallback(
    (setId: string, changes: Partial<Pick<ActiveSet, 'weightKg' | 'reps' | 'completed' | 'rpe' | 'rir' | 'durationSeconds' | 'distanceMeters'>>) =>
      updateSet(exerciseId, setId, changes),
    [updateSet, exerciseId]
  )

  const handleRemove = useCallback(
    (setId: string) => (onSetRemoveRequest ? onSetRemoveRequest(exerciseId, setId) : removeSet(exerciseId, setId)),
    [onSetRemoveRequest, removeSet, exerciseId]
  )

  const handleComplete = useCallback(
    (setId: string, completed: boolean) => onSetCompleted?.(exerciseId, setId, completed),
    [onSetCompleted, exerciseId]
  )

  // Guardia defensiva (el bloque solo existe mientras su ejercicio vive en el store).
  if (!exercise) return null

  const allDone = exercise.sets.length > 0 && exercise.sets.every((s) => s.completed)
  const activeSetId = exercise.sets.find((s) => !s.completed)?.id ?? null
  const showRpeCols = !isCardio && Boolean(showRpe)
  const showRirCols = !isCardio && Boolean(showRir)
  const gridTemplate = setTableColumns(showRpeCols, showRirCols)
  // F122: la propuesta del día vive sobre las series PENDIENTES de trabajo (es lo que el
  // tap va a escribir); si ya están en la escalada, no hay nada que proponer.
  const pendingWorkSets = exercise.sets.filter((s) => !s.completed && !s.isWarmup)
  const escaladaProposal = dayProposal?.kind === 'escalada' ? dayProposal : undefined
  const pendingsMatchEscalada =
    !!escaladaProposal &&
    escaladaProposal.weightsKg.length === pendingWorkSets.length &&
    pendingWorkSets.every((s, i) => Math.abs(s.weightKg - escaladaProposal.weightsKg[i]!) < 0.001)
  const showEscalada =
    showLoadSuggestion &&
    !deloadActive &&
    !!escaladaProposal &&
    pendingWorkSets.length > 0 &&
    !pendingsMatchEscalada
  const showCappedNotice =
    showLoadSuggestion &&
    !deloadActive &&
    (escaladaProposal?.capped ?? false) &&
    pendingWorkSets.length > 0
  const consolidating =
    showLoadSuggestion &&
    !deloadActive &&
    dayProposal?.kind === 'consolidate' &&
    pendingWorkSets.length > 0
  // Botón de calentamiento a pedido: una serie al ~45 % del primer peso pendiente con
  // peso (o de la base reciente); editable después, nunca inyectada sola.
  const warmupKg = (() => {
    const firstWeight = pendingWorkSets.find((s) => s.weightKg > 0)?.weightKg ?? 0
    const ref = firstWeight > 0 ? firstWeight : (recentTopSetAvgKg ?? 0)
    return Math.round(ref * 0.45 * 2) / 2
  })()

  const weightKg = bodyWeight?.weightKg ?? 70
  const met = metForSlug(exerciseSlug ?? exercise.exerciseName)

  return (
    <div data-testid="exercise-block" className="border-t border-border/40 pt-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="truncate font-display text-2xl font-medium tracking-wide text-fg">
              {exercise.exerciseName}
            </h3>
            {pr && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-success/35 bg-success/10 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-success"
                aria-label={t('workout.prTexto', {
                  peso: formatWeight(pr.weightKg, units),
                  reps: pr.reps,
                  e1rm: formatWeight(pr.estimated1RM, units),
                })}
              >
                <Star className="size-2.5 fill-current" aria-hidden />
                PR {formatWeight(pr.weightKg, units)}
              </span>
            )}
            {deloadActive && (
              <span className="rounded-full border border-cta/40 bg-cta/10 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-accent-soft">
                {t('workout.deload')}
              </span>
            )}
          </div>
          {showCappedNotice && (
            <p className="mt-1 text-[0.65rem] text-muted">{t('workout.cappedByPr')}</p>
          )}
          {consolidating && (
            <p className="mt-1 text-[0.65rem] text-muted">{t('workout.consolidando')}</p>
          )}
          {note && <p className="mt-1 text-xs italic text-muted">{t('workout.nota', { nota: note })}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowActions(true)}
          aria-label={t('workout.accionesEjercicio')}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-gold"
        >
          <MoreHorizontal className="size-5" aria-hidden />
        </button>
      </div>

      {showEscalada && escaladaProposal && (
        <button
          type="button"
          onClick={() => onApplyEscalada?.(exerciseId, escaladaProposal.weightsKg)}
          className="mb-1 inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-accent-soft transition-colors hover:text-gold-bright"
          aria-label={t('workout.aplicarEscaladaAria', {
            desde: formatWeight(escaladaProposal.weightsKg[0] ?? 0, units),
            hasta: formatWeight(
              escaladaProposal.weightsKg[escaladaProposal.weightsKg.length - 1] ?? 0,
              units
            ),
          })}
        >
          <Sparkles className="size-3.5" aria-hidden />
          {t('workout.escaladaRango', {
            desde: formatWeight(escaladaProposal.weightsKg[0] ?? 0, units),
            hasta: formatWeight(
              escaladaProposal.weightsKg[escaladaProposal.weightsKg.length - 1] ?? 0,
              units
            ),
          })}
        </button>
      )}

      {/* Sugerencia en vivo por bloque (F98.2): reemplaza al overlay de página. La key por
          id remonta el chip cuando cambia la sugerencia y resetea su descarte local. */}
      {liveSuggestion && (
        <SuggestionChip
          key={liveSuggestion.id}
          suggestion={liveSuggestion}
          onApply={onSuggestionApply}
          onWarmup={onSuggestionWarmup}
        />
      )}

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
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 border-t border-border/40 text-xs text-muted transition-colors hover:text-accent-soft"
          >
            {t('workout.inputManual')}
          </button>
        </>
      ) : (
        <>
          {/* ── Fuerza (o cardio manual): tabla B2 de una línea ── */}
          <div
            className="mt-2 grid items-center gap-1.5 border-b border-border/40 pb-1 text-[8px] font-semibold uppercase tracking-[0.13em] text-muted"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <span className="text-center">{t('workout.set')}</span>
            {isCardio ? (
              <>
                <span className="text-center">{t('workout.duracionSerie')}</span>
                <span className="text-center">{t('workout.distanciaSerie')}</span>
              </>
            ) : (
              <>
                <span className="text-center">{t('workout.peso', { unidad: formatUnits(units) })}</span>
                <span className="text-center">{t('workout.reps')}</span>
              </>
            )}
            {showRpeCols && <span className="text-center">{t('workout.rpe')}</span>}
            {showRirCols && <span className="text-center">{t('workout.rir')}</span>}
            <span />
          </div>

          <div>
            {exercise.sets.map((set) => (
              <SetRow
                key={set.id}
                exerciseId={exerciseId}
                setId={set.id}
                showRpe={showRpeCols}
                showRir={showRirCols}
                units={units}
                isCardio={isCardio}
                isActive={set.id === activeSetId}
                isPR={pr ? isPR(set.weightKg, set.reps, pr) : false}
                deloadSuggestion={
                  deloadActive && set.weightKg > 0
                    ? formatWeight(deloadSuggestedWeight(set.weightKg), units)
                    : null
                }
                onUpdate={handleUpdate}
                onRemove={handleRemove}
                onComplete={handleComplete}
                registerInput={registerInput}
                onEnter={handleSetEnter}
              />
            ))}
          </div>

          <button
            onClick={handleAddSet}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 border-t border-border/40 text-sm text-muted transition-colors hover:text-accent-soft"
          >
            <Plus className="size-4" aria-hidden />
            {t('workout.anadirSerie')}
          </button>
        </>
      )}

      {showTechnique && (
        <TechniqueChecklist
          exerciseSlug={exerciseSlug ?? exercise.exerciseName}
          exerciseName={exercise.exerciseName}
          onClose={() => setShowTechnique(false)}
        />
      )}

      {showActions && (
        <ExerciseActionsSheet
          exerciseName={exercise.exerciseName}
          warmupKg={warmupKg}
          canFinish={Boolean(onCompleteExercise) && !allDone}
          onTechnique={() => {
            setShowActions(false)
            setShowTechnique(true)
          }}
          onWarmup={
            onSuggestionWarmup
              ? (weight) => {
                  onSuggestionWarmup(exerciseId, weight)
                  setShowActions(false)
                }
              : undefined
          }
          onFinish={
            onCompleteExercise
              ? () => {
                  onCompleteExercise(exerciseId)
                  setShowActions(false)
                }
              : undefined
          }
          onRemove={() => {
            setShowActions(false)
            handleRemoveExercise()
          }}
          onClose={() => setShowActions(false)}
        />
      )}
    </div>
  )
})
