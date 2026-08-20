// Temporizador de descanso de la sesión activa con recomendación inteligente, anillo SVG, avisos sonoros y haptics.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/ui/Button'
import { playBoxingBellSound, playRestWarningSound, vibrate } from '@/lib/feedback'
import { calcRestRecommendation } from '@/domain/restRecommendation'
import { mapToRestCategory, mapToTrainingGoal } from '@/domain/restCategoryMapper'
import type { MuscleGroup, Objective } from '@/domain/types'

const PRESETS = [30, 60, 90, 120, 180]
const R = 52
const CIRC = 2 * Math.PI * R

interface RestTimerProps {
  muscleGroup?: MuscleGroup
  exerciseName?: string
  rpe?: number
  rir?: number
  objective?: Objective
}

export const RestTimer = ({
  muscleGroup,
  exerciseName,
  rpe,
  rir,
  objective,
}: RestTimerProps) => {
  const { t } = useTranslation()
  const restRemaining = useActiveWorkoutStore((s) => s.restRemaining)
  const restSeconds = useActiveWorkoutStore((s) => s.restSeconds)
  const isResting = useActiveWorkoutStore((s) => s.isResting)
  const startRest = useActiveWorkoutStore((s) => s.startRest)
  const tickRest = useActiveWorkoutStore((s) => s.tickRest)
  const stopRest = useActiveWorkoutStore((s) => s.stopRest)
  const setRestSeconds = useActiveWorkoutStore((s) => s.setRestSeconds)
  const { settings } = useSettings()
  const hitZeroRef = useRef(false)
  const lastWarnedRef = useRef(-1)
  const [justFinished, setJustFinished] = useState(false)

  // Calcula recomendación de descanso si hay datos del ejercicio.
  const recommendation = useMemo(() => {
    if (!muscleGroup || !exerciseName) return null
    const category = mapToRestCategory(muscleGroup, exerciseName)
    const goal = mapToTrainingGoal(objective ?? 'general')
    return calcRestRecommendation(category, goal, rpe, rir)
  }, [muscleGroup, exerciseName, rpe, rir, objective])

  // Reduce el contador una vez por segundo mientras hay descanso en curso.
  useEffect(() => {
    if (!isResting) return
    const id = setInterval(tickRest, 1000)
    return () => clearInterval(id)
  }, [isResting, tickRest])

  // Avisa una única vez por segundo en los últimos 3s (guard: no repetir el mismo valor).
  useEffect(() => {
    if (!isResting) {
      lastWarnedRef.current = -1
      return
    }
    if (restRemaining > 0 && restRemaining <= 3 && restRemaining !== lastWarnedRef.current) {
      lastWarnedRef.current = restRemaining
      if (settings.restSound) playRestWarningSound()
    }
  }, [isResting, restRemaining, settings.restSound])

  // Marca que el contador llegó a cero para disparar la "campana" al salir del estado de descanso.
  useEffect(() => {
    if (isResting && restRemaining === 0) {
      hitZeroRef.current = true
      return
    }
  }, [isResting, restRemaining])

  // Al terminar el descanso: sonido de campana, vibración y mensaje de retorno (si la config lo permite).
  useEffect(() => {
    if (isResting) {
      hitZeroRef.current = false
      setJustFinished(false)
      return
    }
    if (hitZeroRef.current) {
      hitZeroRef.current = false
      setJustFinished(true)
      if (settings.restSound) playBoxingBellSound()
      if (settings.restVibrate) vibrate([200, 100, 200])
    }
  }, [isResting, settings.restSound, settings.restVibrate])

  // Progreso del anillo = tiempo consumido respecto al total configurado, acotado a [0, 1].
  const progress = restSeconds > 0 ? (restSeconds - restRemaining) / restSeconds : 0
  const pct = Math.min(progress, 1)
  const almostDone = isResting && restRemaining > 0 && restRemaining <= 3
  const countdown = isResting ? restRemaining : 0

  // Presets dinámicos: incluye el recomendado si no está en la lista.
  const displayPresets = useMemo(() => {
    if (!recommendation) return PRESETS
    const rec = recommendation.recommendedSeconds
    if (PRESETS.includes(rec)) return PRESETS
    // Insertar el recomendado y ordenar.
    return [...PRESETS, rec].sort((a, b) => a - b)
  }, [recommendation])

  return (
    <section
      className={`panel rounded-2xl p-4 transition-colors ${
        almostDone ? 'animate-timer-peak border-danger' : ''
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-accent">
          {t('workout.descanso')}
        </h3>
        <span className={`kicker ${almostDone ? '!text-danger' : ''}`}>
          {countdown > 0 ? `${countdown}s` : t('workout.listo')}
        </span>
      </div>

      {/* Recomendación inteligente */}
      {recommendation && !isResting && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-cta/10 px-3 py-2">
          <Sparkles className="size-4 shrink-0 text-cta" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-fg">
              {t('rest.recommended', { min: recommendation.minSeconds, max: recommendation.maxSeconds })}
            </p>
            <p className="text-[0.6rem] text-muted">
              {recommendation.reason === 'rest.reason_compound_fuerza'
                ? t('rest.reason_compound_fuerza')
                : recommendation.reason === 'rest.reason_compound_hipertrofia'
                  ? t('rest.reason_compound_hipertrofia')
                  : recommendation.reason === 'rest.reason_isolation'
                    ? t('rest.reason_isolation')
                    : t('rest.reason_general')}
            </p>
          </div>
          <button
            onClick={() => {
              setRestSeconds(recommendation.recommendedSeconds)
            }}
            className="shrink-0 rounded-lg bg-cta/20 px-2 py-1 text-[0.65rem] font-semibold text-accent-soft transition-colors hover:bg-cta/30"
          >
            {recommendation.recommendedSeconds >= 60
              ? `${recommendation.recommendedSeconds / 60}m`
              : `${recommendation.recommendedSeconds}s`}
          </button>
        </div>
      )}

      <div className="relative mx-auto mb-4 size-28">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="7"
          />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke={almostDone ? 'var(--color-danger)' : 'var(--color-cta)'}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - pct)}
            className={
              almostDone
                ? 'animate-timer-peak'
                : 'transition-[stroke-dashoffset] duration-1000 ease-linear'
            }
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-display text-4xl font-bold tabular-nums ${
              almostDone ? 'text-danger' : countdown > 0 ? 'text-fg' : 'text-muted'
            }`}
          >
            {countdown > 0 ? countdown : t('workout.ok')}
          </span>
        </div>
      </div>

      {justFinished && (
        <p
          className="mb-3 text-center text-sm font-medium text-cta"
          aria-live="polite"
        >
          {t('workout.vuelveSiguiente')}
        </p>
      )}

      <div className="mb-3 flex gap-2">
        {displayPresets.map((s) => {
          const isRecommended = recommendation?.recommendedSeconds === s
          return (
            <button
              key={s}
              onClick={() => {
                setRestSeconds(s)
                if (isResting) startRest()
              }}
              className={`flex min-h-[44px] flex-1 items-center justify-center rounded-lg py-1.5 text-xs font-medium transition-colors ${
                restSeconds === s
                  ? 'border border-cta bg-cta/20 text-accent-soft'
                  : isRecommended
                    ? 'border border-accent/40 bg-accent/10 text-accent-soft hover:border-accent'
                    : 'border border-border bg-bg text-muted hover:border-cta hover:text-accent-soft'
              }`}
            >
              {s >= 60 ? `${s / 60}m` : `${s}s`}
            </button>
          )
        })}
      </div>

      <div className="flex gap-2">
        {!isResting ? (
          <Button
            size="sm"
            className="flex-1"
            onClick={startRest}
          >
            <Play className="size-4" fill="currentColor" />
            {t('workout.iniciarDescanso')}
          </Button>
        ) : (
          <>
            <button
              onClick={stopRest}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-bg text-fg font-medium transition-colors hover:border-cta"
            >
              <Pause className="size-4" />
              {t('workout.pausar')}
            </button>
            <button
              onClick={() => {
                stopRest()
                startRest()
              }}
              aria-label={t('workout.reiniciarDescanso')}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-bg px-4 text-muted transition-colors hover:border-cta hover:text-accent-soft"
            >
              <RotateCcw className="size-4" aria-hidden />
            </button>
          </>
        )}
      </div>
    </section>
  )
}
