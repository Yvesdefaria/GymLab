// Timer de entrenamiento: modos Tabata, EMOM, AMRAP, For Time, Custom.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, RotateCcw } from 'lucide-react'
import {
  type TimerMode,
  type RoundConfig,
  type TimerState,
  timerPresets,
  reconcileTimer,
  startTimer,
  pauseTimer,
  initialTimerState,
  formatTime,
} from '@/domain/roundTimer'
import { prefersReducedMotion } from '@/lib/animations'
import { buzz } from '@/lib/buzz'
import { TimerRing } from '@/components/timer/TimerRing'
import { TimerDisplay } from '@/components/timer/TimerDisplay'
import anime from 'animejs'

const modes: TimerMode[] = ['tabata', 'emom', 'amrap', 'fortime', 'custom']

export const WorkoutTimer = () => {
  const { t } = useTranslation()
  const [mode, setMode] = useState<TimerMode>('tabata')
  const [config, setConfig] = useState<RoundConfig>(timerPresets.tabata)
  const [state, setState] = useState<TimerState>(initialTimerState(timerPresets.tabata))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

  // Beep y vibración al cambio de fase.
  const playBeep = useCallback(() => {
    buzz()
  }, [])

  // Tick del timer.
  useEffect(() => {
    if (!state.isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        // Sólo repinta desde el deadline; el beep suena al cambiar de fase (F96).
        const next = reconcileTimer(prev, config)
        if (next.phase !== prev.phase || next.phase === 'finished') playBeep()
        return next
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.isRunning, config, playBeep])

  // Cambiar modo.
  const changeMode = (newMode: TimerMode) => {
    setMode(newMode)
    const newConfig = timerPresets[newMode]
    setConfig(newConfig)
    setState(initialTimerState(newConfig))
  }

  // Toggle play/pause: pausa/reanuda anclando el deadline (F96).
  const togglePlay = () => {
    setState((prev) => (prev.isRunning ? pauseTimer(prev) : startTimer(prev)))
  }

  // Reset.
  const reset = () => {
    setState(initialTimerState(config))
  }

  // Color del anillo por fase (el progreso lo deriva TimerRing del mismo deadline).
  const ringColor =
    state.phase === 'work'
      ? 'var(--color-success)'
      : state.phase === 'rest'
        ? 'var(--color-warning)'
        : 'var(--color-muted)'

  return (
    <div ref={containerRef} style={{ opacity: 0 }} className="flex flex-col items-center gap-4">
      <p className="kicker">{t('timer.title')}</p>

      {/* Selector de modo */}
      <div className="flex gap-1.5">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => changeMode(m)}
            className={`rounded-lg px-2 py-1.5 text-[0.65rem] font-medium transition-colors ${
              mode === m
                ? 'bg-accent text-accent-fg'
                : 'bg-bg-elevated/50 text-muted hover:bg-bg-elevated'
            }`}
          >
            {t(`timer.modes.${m}`)}
          </button>
        ))}
      </div>

      {/* Círculo de progreso + tiempo */}
      <TimerRing
        remaining={state.secondsRemaining}
        total={state.totalSeconds}
        mode="remaining"
        radius={70}
        strokeWidth={6}
        viewBox={160}
        color={ringColor}
        className="size-40"
      >
        <TimerDisplay
          seconds={state.secondsRemaining}
          className="text-3xl font-bold text-fg"
          label={
            state.phase === 'work'
              ? t('timer.phase.work')
              : state.phase === 'rest'
                ? t('timer.phase.rest')
                : t('timer.phase.finished')
          }
        />
      </TimerRing>

      {/* Info de rondas */}
      <div className="flex items-center gap-4 text-[0.65rem] text-muted">
        <span>
          {t('timer.rounds', {
            current: state.totalRoundsCompleted,
            total: config.totalRounds > 0 ? config.totalRounds : '∞',
          })}
        </span>
        <span>{t('timer.elapsed', { time: formatTime(state.elapsed) })}</span>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-bg-elevated/50 p-3 text-muted transition-colors hover:bg-bg-elevated"
          aria-label={t('timer.reset')}
        >
          <RotateCcw className="size-5" />
        </button>
        <button
          onClick={togglePlay}
          className="rounded-full bg-accent p-4 text-accent-fg transition-transform hover:scale-105 active:scale-95"
          aria-label={state.isRunning ? t('timer.pause') : t('timer.play')}
        >
          {state.isRunning ? <Pause className="size-6" /> : <Play className="size-6" />}
        </button>
      </div>

      {/* Configuración rápida */}
      {mode === 'custom' && (
        <div className="flex flex-col gap-2 rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[0.65rem] text-muted">{t('timer.config.work')}</span>
            <input
              type="number"
              value={config.workSeconds}
              onChange={(e) => {
                const v = Number(e.target.value)
                const newConfig = { ...config, workSeconds: v }
                setConfig(newConfig)
                setState(initialTimerState(newConfig))
              }}
              className="w-16 rounded-lg bg-bg-elevated/50 px-2 py-1 text-center text-xs text-fg"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[0.65rem] text-muted">{t('timer.config.rest')}</span>
            <input
              type="number"
              value={config.restSeconds}
              onChange={(e) => {
                const v = Number(e.target.value)
                const newConfig = { ...config, restSeconds: v }
                setConfig(newConfig)
                setState(initialTimerState(newConfig))
              }}
              className="w-16 rounded-lg bg-bg-elevated/50 px-2 py-1 text-center text-xs text-fg"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[0.65rem] text-muted">{t('timer.config.totalRounds')}</span>
            <input
              type="number"
              value={config.totalRounds}
              onChange={(e) => {
                const v = Number(e.target.value)
                const newConfig = { ...config, totalRounds: v }
                setConfig(newConfig)
                setState(initialTimerState(newConfig))
              }}
              className="w-16 rounded-lg bg-bg-elevated/50 px-2 py-1 text-center text-xs text-fg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
