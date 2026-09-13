// Temporizador de descanso de la sesión activa con recomendación inteligente, anillo SVG, avisos sonoros y haptics.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/ui/Button'
import { TimerRing } from '@/components/timer/TimerRing'
import { TimerDisplay } from '@/components/timer/TimerDisplay'
import { playBoxingBellSound, playRestWarningSound } from '@/lib/feedback'
import { haptics } from '@/lib/haptics'
import { calcRestRecommendation } from '@/domain/restRecommendation'
import { mapToRestCategory, mapToTrainingGoal } from '@/domain/restCategoryMapper'
import type { MuscleGroup, Objective } from '@/domain/types'

const PRESETS = [30, 60, 90, 120, 180]

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
  const reconcileRest = useActiveWorkoutStore((s) => s.reconcileRest)
  const stopRest = useActiveWorkoutStore((s) => s.stopRest)
  const restMode = useActiveWorkoutStore((s) => s.restMode)
  const setRestMode = useActiveWorkoutStore((s) => s.setRestMode)
  const setAutoRestSeconds = useActiveWorkoutStore((s) => s.setAutoRestSeconds)
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

  // Mantiene fresca en el store la recomendación del modo Auto (F96, D2).
  useEffect(() => {
    if (recommendation) setAutoRestSeconds(recommendation.recommendedSeconds)
  }, [recommendation, setAutoRestSeconds])

  const isAuto = restMode === 'auto'

  // Cambiar de modo refresca el preview; si hay descanso en curso, lo reinicia con el nuevo valor.
  const selectMode = (mode: 'auto' | number) => {
    setRestMode(mode)
    if (isResting) startRest()
  }

  // El intervalo de 1 Hz sólo repinta: el restante se deriva del deadline en el store (F96).
  useEffect(() => {
    if (!isResting) return
    const id = setInterval(reconcileRest, 1000)
    return () => clearInterval(id)
  }, [isResting, reconcileRest])

  // Al volver a primer plano se reconcilia contra el deadline, no contra ticks perdidos.
  // Web: visibilitychange. Nativo: appStateChange/resume con limpieza (patrón useHealthSync).
  useEffect(() => {
    const reconcileNow = () => {
      useActiveWorkoutStore.getState().reconcileRest()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') reconcileNow()
    }
    document.addEventListener('visibilitychange', onVisibility)
    const nativeHandlers = Capacitor.isNativePlatform()
      ? [
          App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) reconcileNow()
          }),
          App.addListener('resume', reconcileNow),
        ]
      : []
    reconcileNow()
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      nativeHandlers.forEach((handler) => void handler.then((l) => l.remove()))
    }
  }, [])

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
      haptics([200, 100, 200], { enabled: settings.restVibrate })
    }
  }, [isResting, settings.restSound, settings.restVibrate])

  const almostDone = isResting && restRemaining > 0 && restRemaining <= 3
  const countdown = isResting ? restRemaining : 0

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

      {/* Modo Auto (96.1): control propio, nunca un preset más; la recomendación vive aquí. */}
      <div className="mb-3 flex items-center gap-2 rounded-xl bg-cta/10 px-3 py-2">
        <Sparkles className="size-4 shrink-0 text-cta" />
        <div className="min-w-0 flex-1">
          {recommendation ? (
            <>
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
            </>
          ) : (
            <p className="text-xs font-medium text-fg">{t('rest.autoHint')}</p>
          )}
        </div>
        <button
          type="button"
          data-testid="rest-mode-auto"
          aria-pressed={isAuto}
          aria-label={t('rest.autoAria')}
          onClick={() => selectMode('auto')}
          className={`shrink-0 rounded-lg border px-2 py-1 text-[0.65rem] font-semibold transition-colors ${
            isAuto
              ? 'border-cta bg-cta/30 text-accent-soft'
              : 'border-border bg-bg text-muted hover:border-cta hover:text-accent-soft'
          }`}
        >
          {t('rest.auto')}
        </button>
      </div>

      <TimerRing
        remaining={restRemaining}
        total={restSeconds}
        mode="elapsed"
        radius={52}
        strokeWidth={7}
        pulse={almostDone}
        color={almostDone ? 'var(--color-danger)' : 'var(--color-cta)'}
        className="mx-auto mb-4 size-28"
      >
        <TimerDisplay
          seconds={countdown}
          format={settings.timerFormat}
          zeroLabel={t('workout.ok')}
          className={`font-display text-4xl font-bold tabular-nums ${
            almostDone ? 'text-danger' : countdown > 0 ? 'text-fg' : 'text-muted'
          }`}
        />
      </TimerRing>

      {justFinished && (
        <p
          className="mb-3 text-center text-sm font-medium text-cta"
          aria-live="polite"
        >
          {t('workout.vuelveSiguiente')}
        </p>
      )}

      {/* Presets duros, sin fusionar el recomendado: Auto es su única representación (96.1). */}
      <div className="mb-3 flex gap-2">
        {PRESETS.map((s) => {
          const selected = restMode === s
          return (
            <button
              key={s}
              type="button"
              data-testid="rest-preset"
              data-preset={s}
              aria-pressed={selected}
              onClick={() => selectMode(s)}
              className={`flex min-h-[44px] flex-1 items-center justify-center rounded-lg py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? 'border border-cta bg-cta/20 text-accent-soft'
                  : 'border border-border bg-bg text-muted hover:border-cta hover:text-accent-soft'
              }`}
            >
              {s >= 60 ? `${Math.round(s / 60)}m` : `${s}s`}
            </button>
          )
        })}
      </div>

      <div className="flex gap-2">
        {!isResting ? (
          <Button
            size="sm"
            className="flex-1"
            onClick={() => startRest()}
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
