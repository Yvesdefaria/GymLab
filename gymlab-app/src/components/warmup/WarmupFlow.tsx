// Flujo de calentamiento guiado: ejercicios dinámicos con temporizador.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, SkipForward, Flame } from 'lucide-react'
import {
  generalWarmup,
  type WarmupState,
  initialWarmupState,
  tickWarmup,
  nextWarmupExercise,
} from '@/domain/warmup'
import { formatTime } from '@/domain/roundTimer'
import { prefersReducedMotion } from '@/lib/animations'
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
  const progress = exercise
    ? exercise.durationSeconds > 0
      ? state.secondsRemaining / exercise.durationSeconds
      : 0
    : 0

  // Beep al cambio de ejercicio.
  const playBeep = useCallback(() => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 660
      gain.gain.value = 0.2
      osc.start()
      osc.stop(ctx.currentTime + 0.1)
    } catch { /* silent */ }
    if (navigator.vibrate) navigator.vibrate(150)
  }, [])

  // Tick.
  useEffect(() => {
    if (!state.isRunning || state.isFinished) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        const next = tickWarmup(prev)
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

  // Toggle play/pause.
  const togglePlay = () => {
    setState((prev) => ({ ...prev, isRunning: !prev.isRunning }))
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

  const radius = 50
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

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
      <div className="relative flex items-center justify-center">
        <svg className="size-28 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="4" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-fg">{formatTime(state.secondsRemaining)}</p>
          <p className="text-[0.6rem] text-muted">
            {state.currentIndex + 1} / {generalWarmup.exercises.length}
          </p>
        </div>
      </div>

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
    </div>
  )
}
