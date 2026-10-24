// F132.2/B2 — fila de una sola línea: # · peso/duración · reps/distancia · [RPE] · [RIR] · check.
// Conserva el registro fino por serie, la cadena de foco, cardio, calentamiento, PR,
// deload y el borrado por long-press/context menu (sin un tercer icono en la tabla).
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Timer, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import type { ActiveSet } from '@/store/activeWorkoutStore'
import type { Units } from '@/domain/settings'
import { applyUnits, parseWeightToKg, formatUnits } from '@/domain/settings'
import { clamp, sanitizeDecimalDraft } from '@/domain/numberGuard'
import type { SetField } from '@/domain/setInputChain'
import { DecimalInput } from '@/components/ui/DecimalInput'
import { formatDuration, parseDuration } from '@/lib/duration'
import { MAX_WEIGHT_KG } from '@/domain/calculators/plates'
import { setColumnsKey, setTableColumns } from './setTableColumns'

const MAX_REPS = 1000
const MAX_DISTANCE = 100000
const LONG_PRESS_MS = 600

type SetRowProps = {
  exerciseId: number
  setId: string
  isPR: boolean
  showRpe?: boolean
  showRir?: boolean
  units: Units
  isCardio?: boolean
  isActive?: boolean
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

export const SetRow = memo(({
  exerciseId,
  setId,
  isPR,
  showRpe,
  showRir,
  units,
  isCardio,
  isActive,
  deloadSuggestion,
  onUpdate,
  onRemove,
  onComplete,
  registerInput,
  onEnter,
}: SetRowProps) => {
  const { t } = useTranslation()
  // Selector fino: solo esta serie. Si cambia otra serie del mismo ejercicio, esta fila no se re-renderiza.
  const set = useActiveWorkoutStore((s) => {
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId)
    return ex?.sets.find((s2) => s2.id === setId)
  })

  // Borrador local de duración (F102.5): mientras se teclea muestra el texto saneado; al salir vuelve al guardado.
  const [durationDraft, setDurationDraft] = useState<string | null>(null)
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (longPressRef.current) clearTimeout(longPressRef.current)
    },
    []
  )

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

  // Borrado sin tercer icono: long-press en la fila (mobile) o click derecho (desktop).
  // No se activa si el gesto empieza en un input o en el check.
  const startLongPress = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement
      if (target.closest('input, button, textarea, select')) return
      if (longPressRef.current) clearTimeout(longPressRef.current)
      longPressRef.current = setTimeout(() => {
        longPressRef.current = null
        onRemove(setId)
      }, LONG_PRESS_MS)
    },
    [onRemove, setId]
  )
  const cancelLongPress = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
  }, [])
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      onRemove(setId)
    },
    [onRemove, setId]
  )

  if (!set) return null

  const warmup = Boolean(set.isWarmup)
  const pace = calcPace(set.durationSeconds ?? 0, set.distanceMeters ?? 0)
  // Solo sugiere reducción si la serie tiene carga y el padre pasó una sugerencia.
  const showDeloadSuggestion = !isCardio && set.weightKg > 0 && !!deloadSuggestion
  const showRpeCol = !isCardio && Boolean(showRpe)
  const showRirCol = !isCardio && Boolean(showRir)
  const gridTemplate = setTableColumns(showRpeCol, showRirCol)
  const columnsKey = setColumnsKey(showRpeCol, showRirCol)
  const active = Boolean(isActive) && !set.completed

  const inputBorder = active ? 'border-cta/45' : 'border-border'
  const completed = set.completed ? 'opacity-80' : ''

  return (
    <div
      data-testid="set-row"
      data-columns={columnsKey}
      style={{ gridTemplateColumns: gridTemplate }}
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onContextMenu={handleContextMenu}
      title={t('workout.eliminarSerieHint')}
      className={`grid min-h-11 items-center gap-1.5 border-t border-border/40 px-1 py-1 ${
        warmup ? 'bg-cta/5' : active ? 'bg-cta/5' : ''
      } ${completed}`}
    >
      <span className="flex min-w-0 flex-col items-center justify-center gap-0.5 text-center font-display text-[11px] font-semibold leading-none text-muted">
        {warmup ? (
          <span className="rounded-full border border-cta/40 bg-cta/10 px-1 py-0.5 text-[0.5rem] font-semibold uppercase tracking-wide text-accent-soft">
            {t('workout.cal')}
          </span>
        ) : (
          <>
            <span className={set.completed ? 'text-muted' : 'text-fg'}>{set.setNumber}</span>
            {isPR && (
              <span className="rounded bg-success/15 px-1 text-[0.45rem] font-bold uppercase leading-tight tracking-wider text-success">
                PR
              </span>
            )}
          </>
        )}
      </span>

      {isCardio ? (
        <div className="relative flex min-w-0 items-center">
          <Timer className="absolute left-1.5 size-3 text-muted" aria-hidden />
          <input
            type="text"
            value={durationDraft ?? (set.durationSeconds ? formatDuration(set.durationSeconds, 'mm:ss') : '')}
            onChange={(e) => {
              const raw = e.target.value
              const formatted = sanitizeDecimalDraft(raw, 'duration')
              setDurationDraft(formatted)
              // Solo-junk no debe limpiar la duración guardada; el vacío real sí (0).
              if (formatted !== '' || raw === '') onUpdate(setId, { durationSeconds: parseDuration(formatted) })
            }}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={() => setDurationDraft(null)}
            inputMode="numeric"
            placeholder="0:00"
            className="h-11 w-full rounded-lg border border-border bg-bg pl-6 pr-2 text-center text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
            aria-label={t('workout.duracionSerie')}
          />
        </div>
      ) : (
        <div className="flex min-w-0 flex-col">
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
            className={`h-11 w-full min-w-0 rounded-lg border bg-bg px-2 text-center text-sm text-fg placeholder:text-muted focus:outline-none focus:border-cta ${inputBorder}`}
            ariaLabel={t('workout.pesoEn', { unidad: formatUnits(units) })}
          />
          {showDeloadSuggestion && (
            <span className="mt-0.5 text-center text-[0.6rem] font-medium text-danger/80 line-through">
              {deloadSuggestion}
            </span>
          )}
        </div>
      )}

      {isCardio ? (
        <div className="flex min-w-0 flex-col">
          <div className="relative flex min-w-0 items-center">
            <MapPin className="absolute left-1.5 size-3 text-muted" aria-hidden />
            <DecimalInput
              value={set.distanceMeters}
              onChange={(v) =>
                onUpdate(setId, { distanceMeters: v === undefined ? undefined : clamp(v, 0, MAX_DISTANCE) })
              }
              min={0}
              max={MAX_DISTANCE}
              placeholder="m"
              className="h-11 w-full rounded-lg border border-border bg-bg pl-6 pr-2 text-center text-sm text-fg placeholder:text-muted focus:outline-none focus:border-cta"
              ariaLabel={t('workout.distanciaSerie')}
            />
          </div>
          {pace && <span className="mt-0.5 text-right text-[0.55rem] font-medium text-accent">{pace}</span>}
        </div>
      ) : (
        <DecimalInput
          value={set.reps}
          onChange={(v) => onUpdate(setId, { reps: v === undefined ? 0 : clamp(v, 0, MAX_REPS) })}
          min={0}
          max={MAX_REPS}
          mode="integer"
          inputMode="numeric"
          placeholder={t('workout.reps')}
          inputRef={fieldRef.reps}
          onEnter={fieldEnter.reps}
          className={`h-11 w-full min-w-0 rounded-lg border bg-bg px-2 text-center text-sm text-fg placeholder:text-muted focus:outline-none focus:border-cta ${inputBorder}`}
          ariaLabel={t('workout.repeticiones')}
        />
      )}

      {showRpeCol &&
        (warmup ? (
          <span className="text-center text-xs text-muted" aria-label={t('workout.rpeSerie')}>
            —
          </span>
        ) : (
          <DecimalInput
            value={set.rpe}
            onChange={(v) => onUpdate(setId, { rpe: v === undefined ? undefined : clamp(v, 4, 10) })}
            min={4}
            max={10}
            placeholder={t('workout.rpe')}
            inputRef={fieldRef.rpe}
            onEnter={fieldEnter.rpe}
            className={`h-11 w-full min-w-0 rounded-lg border bg-bg px-1 text-center text-xs text-fg placeholder:text-muted focus:border-cta focus:outline-none ${inputBorder}`}
            ariaLabel={t('workout.rpeSerie')}
          />
        ))}

      {showRirCol &&
        (warmup ? (
          <span className="text-center text-xs text-muted" aria-label={t('workout.rirSerie')}>
            —
          </span>
        ) : (
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
            className={`h-11 w-full min-w-0 rounded-lg border bg-bg px-1 text-center text-xs text-fg placeholder:text-muted focus:border-cta focus:outline-none ${inputBorder}`}
            ariaLabel={t('workout.rirSerie')}
          />
        ))}

      <button
        type="button"
        onClick={handleToggleComplete}
        className={`relative flex size-8 items-center justify-center justify-self-end rounded-full border transition-colors after:absolute after:-inset-2 after:content-[''] ${
          set.completed
            ? 'border-success/35 bg-success/10 text-success'
            : active
              ? 'border-cta/55 bg-cta/10 text-gold'
              : 'border-border bg-bg text-muted hover:border-cta/60 hover:text-accent-soft'
        }`}
        aria-label={set.completed ? t('workout.marcarIncompleta') : t('workout.marcarCompletada')}
      >
        <Check className="size-4" strokeWidth={set.completed ? 3 : 2} />
      </button>
    </div>
  )
})
