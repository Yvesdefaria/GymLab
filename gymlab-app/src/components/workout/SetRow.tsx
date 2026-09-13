// Fila de una serie dentro de la sesión activa: inputs de peso/reps/RPE/RIR (fuerza) o duración/distancia (cardio).
// Suscripción fina al store: cada fila selecciona SOLO su propia serie, de modo que tipear
// peso/reps en una fila no re-renderiza las filas hermanas. Las acciones llegan por props
// estables (por ids), necesarias para que el memo de esta fila no se venza en cada render.
import { memo, useCallback, useMemo } from 'react'
import { Check, Trash2, Timer, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import type { ActiveSet } from '@/store/activeWorkoutStore'
import type { Units } from '@/domain/settings'
import { applyUnits, parseWeightToKg, formatUnits } from '@/domain/settings'
import { clamp } from '@/domain/numberGuard'
import type { SetField } from '@/domain/setInputChain'
import { DecimalInput } from '@/components/ui/DecimalInput'
import { formatDuration, parseDuration } from '@/lib/duration'
import { MAX_WEIGHT_KG } from '@/domain/calculators/plates'

const MAX_REPS = 1000
const MAX_DISTANCE = 100000

type SetRowProps = {
  exerciseId: number
  setId: string
  isPR: boolean
  showRpe?: boolean
  showRir?: boolean
  units: Units
  isCardio?: boolean
  // Peso reducido sugerido durante el deload (ya formateado en la unidad del usuario); null oculta la sugerencia.
  deloadSuggestion?: string | null
  onUpdate: (
    setId: string,
    changes: Partial<Pick<ActiveSet, 'weightKg' | 'reps' | 'completed' | 'rpe' | 'rir' | 'durationSeconds' | 'distanceMeters'>>
  ) => void
  onRemove: (setId: string) => void
  onComplete?: (setId: string, completed: boolean) => void
  // Cadena de foco (F98.4): registra el input real por campo y avisa al confirmar con Enter.
  registerInput?: (setId: string, field: SetField, el: HTMLInputElement | null) => void
  onEnter?: (setId: string, field: SetField) => void
}

// Calcula ritmo (min/km) a partir de duración y distancia.
const calcPace = (seconds: number, meters: number): string | null => {
  if (meters <= 0 || seconds <= 0) return null
  const paceSeconds = (seconds / meters) * 1000
  const m = Math.floor(paceSeconds / 60)
  const s = Math.round(paceSeconds % 60)
  return `${m}:${String(s).padStart(2, '0')}/km`
}

export const SetRow = memo(({ exerciseId, setId, isPR, showRpe, showRir, units, isCardio, deloadSuggestion, onUpdate, onRemove, onComplete, registerInput, onEnter }: SetRowProps) => {
  const { t } = useTranslation()
  // Selector fino: solo esta serie. Si cambia otra serie del mismo ejercicio, esta fila no se re-renderiza.
  const set = useActiveWorkoutStore((s) => {
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId)
    return ex?.sets.find((s2) => s2.id === setId)
  })

  // Lee el estado actual del store al hacer clic: el callback queda estable sin capturar la serie.
  const handleToggleComplete = useCallback(() => {
    const { exercises } = useActiveWorkoutStore.getState()
    const ex = exercises.find((e) => e.exerciseId === exerciseId)
    const current = ex?.sets.find((s) => s.id === setId)
    if (!current) return
    const next = !current.completed
    onUpdate(setId, { completed: next })
    onComplete?.(setId, next)
  }, [exerciseId, setId, onUpdate, onComplete])

  // Refs y handlers estables por campo: registrar los inputs en el bloque no debe
  // vencer el memo de la fila (tarea 91.2, F98.4).
  const fieldRef = useMemo(
    () => ({
      weight: (el: HTMLInputElement | null) => registerInput?.(setId, 'weight', el),
      reps: (el: HTMLInputElement | null) => registerInput?.(setId, 'reps', el),
      rpe: (el: HTMLInputElement | null) => registerInput?.(setId, 'rpe', el),
      rir: (el: HTMLInputElement | null) => registerInput?.(setId, 'rir', el),
    }),
    [registerInput, setId]
  )

  const fieldEnter = useMemo(
    () => ({
      weight: () => onEnter?.(setId, 'weight'),
      reps: () => onEnter?.(setId, 'reps'),
      rpe: () => onEnter?.(setId, 'rpe'),
      rir: () => onEnter?.(setId, 'rir'),
    }),
    [onEnter, setId]
  )

  if (!set) return null

  const warmup = Boolean(set.isWarmup)
  const pace = calcPace(set.durationSeconds ?? 0, set.distanceMeters ?? 0)
  // Solo sugiere reducción si la serie tiene carga y el padre pasó una sugerencia.
  const showDeloadSuggestion = !isCardio && set.weightKg > 0 && !!deloadSuggestion

  return (
    <div
      className={`rounded-lg px-1 py-1 ${warmup ? 'bg-cta/5' : ''} ${
        set.completed ? 'animate-row-flash opacity-70' : ''
      }`}
    >
      {/* Línea 1 (F98.5): nº de serie · peso/duración · reps/distancia · completar · borrar.
          Todo fluido (sin anchos fijos) para caber a 375 px sin scroll horizontal. */}
      <div className="flex items-center gap-2">
        <span className="flex w-7 shrink-0 flex-col items-center justify-center font-display text-sm font-semibold text-muted">
          {set.setNumber}
          {isPR && (
            <span className="rounded bg-cta/20 px-1 text-[0.5rem] font-bold uppercase leading-tight tracking-wider text-cta">
              PR
            </span>
          )}
          {warmup && (
            <span className="rounded bg-cta/10 px-1 text-[0.5rem] font-medium uppercase leading-tight tracking-wider text-cta">
              {t('workout.cal')}
            </span>
          )}
          {warmup && <span className="sr-only"> {t('workout.calentamiento')}</span>}
        </span>

        {isCardio ? (
          /* ── Modo cardio: duración + distancia ── */
          <>
            <div className="relative flex min-w-0 flex-1 items-center">
              <Timer className="absolute left-1.5 size-3 text-muted" />
              <input
                type="text"
                value={set.durationSeconds ? formatDuration(set.durationSeconds) : ''}
                onChange={(e) => onUpdate(setId, { durationSeconds: parseDuration(e.target.value) })}
                placeholder="0:00"
                className="h-11 w-full rounded-lg border border-border bg-bg pl-6 pr-2 text-center text-sm text-fg placeholder:text-muted focus:outline-none focus:border-cta"
                aria-label={t('workout.duracionSerie')}
              />
            </div>
            <div className="relative flex min-w-0 flex-1 items-center">
              <MapPin className="absolute left-1.5 size-3 text-muted" />
              <DecimalInput
                value={set.distanceMeters}
                onChange={(v) => onUpdate(setId, { distanceMeters: v === undefined ? undefined : clamp(v, 0, MAX_DISTANCE) })}
                min={0}
                max={MAX_DISTANCE}
                placeholder="m"
                className="h-11 w-full rounded-lg border border-border bg-bg pl-6 pr-2 text-center text-sm text-fg placeholder:text-muted focus:outline-none focus:border-cta"
                ariaLabel={t('workout.distanciaSerie')}
              />
            </div>
          </>
        ) : (
          /* ── Modo fuerza: peso + reps ── */
          <>
            <DecimalInput
              value={set.weightKg ? applyUnits(set.weightKg, units) : 0}
              onChange={(v) =>
                onUpdate(setId, {
                  weightKg: v === undefined ? 0 : clamp(parseWeightToKg(v, units), 0, MAX_WEIGHT_KG),
                })
              }
              min={0}
              placeholder={formatUnits(units)}
              inputRef={fieldRef.weight}
              onEnter={fieldEnter.weight}
              className={`h-11 min-w-0 flex-1 rounded-lg border bg-bg px-2 text-center text-sm text-fg placeholder:text-muted focus:outline-none ${
                warmup ? 'border-cta/40 focus:border-cta' : 'border-border focus:border-cta'
              }`}
              ariaLabel={t('workout.pesoEn', { unidad: formatUnits(units) })}
            />
            <DecimalInput
              value={set.reps}
              onChange={(v) => onUpdate(setId, { reps: v === undefined ? 0 : clamp(v, 0, MAX_REPS) })}
              min={0}
              max={MAX_REPS}
              inputMode="numeric"
              placeholder={t('workout.reps')}
              inputRef={fieldRef.reps}
              onEnter={fieldEnter.reps}
              className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-bg px-2 text-center text-sm text-fg placeholder:text-muted focus:outline-none"
              ariaLabel={t('workout.repeticiones')}
            />
          </>
        )}

        <button
          onClick={handleToggleComplete}
          className={`flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors ${
            set.completed
              ? 'animate-pop bg-cta text-on-gold shadow-[0_0_16px_-3px_color-mix(in_srgb,var(--color-cta)_75%,transparent)]'
              : 'border border-border bg-bg text-muted hover:border-cta/60 hover:text-accent-soft'
          }`}
          aria-label={set.completed ? t('workout.marcarIncompleta') : t('workout.marcarCompletada')}
        >
          <Check className="size-5" strokeWidth={set.completed ? 3 : 2} />
        </button>

        <button
          onClick={() => onRemove(setId)}
          className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-bg text-danger/90 transition-colors hover:border-danger/50 hover:text-danger"
          aria-label={t('workout.eliminarSerie')}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {/* Línea 2 (solo modo fuerza): RPE + RIR, cada uno ≥44 px y sin scroll. */}
      {!isCardio && (showRpe || showRir) && (
        <div className="mt-2 flex items-center gap-2 pl-9">
          {showRpe && (
            <DecimalInput
              value={set.rpe}
              onChange={(v) => onUpdate(setId, { rpe: v === undefined ? undefined : clamp(v, 4, 10) })}
              min={4}
              max={10}
              placeholder={t('workout.rpe')}
              inputRef={fieldRef.rpe}
              onEnter={fieldEnter.rpe}
              className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-bg px-1 text-center text-xs text-fg placeholder:text-muted focus:border-cta focus:outline-none"
              ariaLabel={t('workout.rpeSerie')}
            />
          )}
          {showRir && (
            <DecimalInput
              value={set.rir}
              onChange={(v) => onUpdate(setId, { rir: v === undefined ? undefined : clamp(v, 0, 6) })}
              min={0}
              max={6}
              zeroAsEmpty={false}
              inputMode="numeric"
              placeholder={t('workout.rir')}
              inputRef={fieldRef.rir}
              onEnter={fieldEnter.rir}
              className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-bg px-1 text-center text-xs text-fg placeholder:text-muted focus:border-cta focus:outline-none"
              ariaLabel={t('workout.rirSerie')}
            />
          )}
        </div>
      )}

      {isCardio && pace && (
        <div className="mt-1 text-right text-[0.55rem] font-medium text-accent">{pace}</div>
      )}

      {showDeloadSuggestion && deloadSuggestion && (
        <p
          className="mt-1 pl-9 text-[0.6rem] font-medium text-danger/80 line-through"
          aria-label={t('perfil.deloadSugeridoAria', { weight: deloadSuggestion })}
        >
          {deloadSuggestion}
        </p>
      )}
    </div>
  )
})