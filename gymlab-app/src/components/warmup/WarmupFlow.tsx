// Flujo de calentamiento guiado: ejercicios dinámicos con temporizador.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, SkipForward, Flame } from 'lucide-react'
import {
  generalWarmup,
  type WarmupState,
  initialWarmupState,
  reconcileWarmup,
  startWarmup,
  pauseWarmup,
  nextWarmupExercise,
} from '@/domain/warmup'
import { prefersReducedMotion } from '@/lib/animations'
import { buzz } from '@/lib/buzz'
import { TimerRing } from '@/components/timer/TimerRing'
import { TimerDisplay } from '@/components/timer/TimerDisplay'
import anime from 'animejs'

interface WarmupFlowProps {
  onDone?: () => void
}

export const WarmupFlow = ({ onDone }: WarmupFlowProps) => {
  const { t } = useTranslation()
  const [state, setState] = useState<WarmupState>(initialWarmupState)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const exercise = generalWarmup.exercises[state.currentIndex]

  // Beep al cambio de ejercicio.
  const playBeep = useCallback(() => {
    buzz({ frequency: 660, gain: 0.2, vibrateMs: 150 })
  }, [])

  // Tick.
  useEffect(() => {
    if (!state.isRunning || state.isFinished) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        // Sólo repinta desde el deadline; el beep suena al cambiar de ejercicio (F96).
        const next = reconcileWarmup(prev)
        if (next.currentIndex !== prev.currentIndex || next.isFinished) playBeep()
        if (next.isFinished) onDone?.()
        return next
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.isRunning, state.isFinished, playBeep, onDone])

  // Animación de entrada.
  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion()) return
    anime({
      targets: containerRef.current,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 300,
      easing: 'easeOutCubic',
    })
  }, [])

  // Toggle play/pause: pausa/reanuda anclando el deadline (F96).
  const togglePlay = () => {
    setState((prev) => (prev.isRunning ? pauseWarmup(prev) : startWarmup(prev)))
  }

  // Saltar al siguiente.
  const skip = () => {
    setState((prev) => {
      const next = nextWarmupExercise(prev)
      if (next.isFinished) onDone?.()
      return next
    })
  }

  // Reset.
  const reset = () => {
    setState(initialWarmupState())
  }

  if (state.isFinished) {
    return (
      <div ref={containerRef} className="flex flex-col items-center gap-3 rounded-xl border border-success/40 bg-success/10 px-4 py-6">
        <Flame className="size-8 text-success" aria-hidden />
        <p className="text-sm font-semibold text-fg">{t('warmup.finished')}</p>
        <button
          onClick={reset}
          className="mt-2 rounded-lg bg-bg-elevated/50 px-4 py-2 text-xs text-muted"
        >
          {t('warmup.restart')}
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4">
      <p className="kicker">{t('warmup.title')}</p>

      {/* Progreso general */}
      <div className="flex gap-1">
        {generalWarmup.exercises.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < state.currentIndex
                ? 'bg-success'
                : i === state.currentIndex
                  ? 'bg-accent'
                  : 'bg-border/30'
            }`}
          />
        ))}
      </div>

      {/* Ejercicio actual + círculo */}
      <TimerRing
        remaining={state.secondsRemaining}
        total={state.totalSeconds}
        mode="remaining"
        radius={50}
        strokeWidth={4}
        color="var(--color-accent)"
        className="size-28"
      >
        <TimerDisplay
          seconds={state.secondsRemaining}
          className="text-2xl font-bold text-fg"
          label={`${state.currentIndex + 1} / ${generalWarmup.exercises.length}`}
        />
      </TimerRing>

      {/* Nombre del ejercicio */}
      {exercise && (
        <div className="text-center">
          <p className="text-sm font-semibold text-fg">
            {exercise.nameKey === 'warmup.exercises.jumpingJacks'
              ? t('warmup.exercises.jumpingJacks')
              : exercise.nameKey === 'warmup.exercises.highKnees'
                ? t('warmup.exercises.highKnees')
                : exercise.nameKey === 'warmup.exercises.armCircles'
                  ? t('warmup.exercises.armCircles')
                  : exercise.nameKey === 'warmup.exercises.bodyweightSquats'
                    ? t('warmup.exercises.bodyweightSquats')
                    : exercise.nameKey === 'warmup.exercises.lunges'
                      ? t('warmup.exercises.lunges')
                      : exercise.nameKey === 'warmup.exercises.hipCircles'
                        ? t('warmup.exercises.hipCircles')
                        : exercise.nameKey === 'warmup.exercises.torsoTwists'
                          ? t('warmup.exercises.torsoTwists')
                          : t('warmup.exercises.shoulderRolls')}
          </p>
          <p className="mt-0.5 text-[0.65rem] text-muted">
            {exercise.descriptionKey === 'warmup.exercises.jumpingJacksDesc'
              ? t('warmup.exercises.jumpingJacksDesc')
              : exercise.descriptionKey === 'warmup.exercises.highKneesDesc'
                ? t('warmup.exercises.highKneesDesc')
                : exercise.descriptionKey === 'warmup.exercises.armCirclesDesc'
                  ? t('warmup.exercises.armCirclesDesc')
                  : exercise.descriptionKey === 'warmup.exercises.bodyweightSquatsDesc'
                    ? t('warmup.exercises.bodyweightSquatsDesc')
                    : exercise.descriptionKey === 'warmup.exercises.lungesDesc'
                      ? t('warmup.exercises.lungesDesc')
                      : exercise.descriptionKey === 'warmup.exercises.hipCirclesDesc'
                        ? t('warmup.exercises.hipCirclesDesc')
                        : exercise.descriptionKey === 'warmup.exercises.torsoTwistsDesc'
                          ? t('warmup.exercises.torsoTwistsDesc')
                          : t('warmup.exercises.shoulderRollsDesc')}
          </p>
        </div>
      )}

      {/* Controles */}
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-bg-elevated/50 p-2.5 text-muted"
          aria-label={t('timer.reset')}
        >
          <Flame className="size-4" />
        </button>
        <button
          onClick={togglePlay}
          className="rounded-full bg-accent p-3.5 text-accent-fg transition-transform hover:scale-105 active:scale-95"
          aria-label={state.isRunning ? t('timer.pause') : t('timer.play')}
        >
          {state.isRunning ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
        <button
          onClick={skip}
          className="rounded-full bg-bg-elevated/50 p-2.5 text-muted"
          aria-label={t('warmup.skip')}
        >
          <SkipForward className="size-4" />
        </button>
      </div>

      <button
        onClick={() => onDone?.()}
        className="mt-2 text-xs text-muted underline-offset-2 hover:underline"
      >
        {t('warmup.skipAll')}
      </button>
    </div>
  )
}
