// F132.2/Q4 — timer de entrenamiento Nocturno: un solo anillo de 214 px,
// tiempo/fase, stats, chips de modo y custom en bottom sheet. Sin verde/ámbar
// de fase: trabajo dorado, descanso muted, últimos 3 s danger.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Pause, Play, RotateCcw, Settings } from 'lucide-react'
import {
  type TimerMode,
  type RoundConfig,
  type TimerState,
  timerPresets,
  reconcileTimer,
  startTimer,
  pauseTimer,
  initialTimerState,
} from '@/domain/roundTimer'
import { prefersReducedMotion } from '@/lib/animations'
import { buzz } from '@/lib/buzz'
import { haptics } from '@/lib/haptics'
import { useSettings } from '@/hooks/useSettings'
import { TimerRing } from '@/components/timer/TimerRing'
import { TimerConfigSheet } from '@/components/timer/TimerConfigSheet'
import { formatDuration } from '@/lib/duration'
import { animate } from 'animejs'

const modes: TimerMode[] = ['tabata', 'emom', 'amrap', 'fortime', 'custom']

type Props = {
  onModeChange?: (mode: TimerMode) => void
}

export const WorkoutTimer = ({ onModeChange }: Props) => {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const [mode, setMode] = useState<TimerMode>('tabata')
  const [config, setConfig] = useState<RoundConfig>(timerPresets.tabata)
  const [state, setState] = useState<TimerState>(initialTimerState(timerPresets.tabata))
  const [showConfig, setShowConfig] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // La página usa el modo activo como título del header.
  useEffect(() => {
    onModeChange?.(mode)
  }, [mode, onModeChange])

  // Animación de entrada.
  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion()) return
    animate(containerRef.current, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 300,
      ease: 'outCubic',
    })
  }, [])

  // Beep y vibración al cambio de fase (vibración vía helper unificado, F96 D5).
  const playBeep = useCallback(() => {
    buzz()
    haptics(200, { enabled: settings.restVibrate })
  }, [settings.restVibrate])

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

  // Aplicar custom: cambia a modo custom y reinicia el estado con la configuración nueva.
  const applyConfig = (next: RoundConfig) => {
    const custom: RoundConfig = { ...next, mode: 'custom' }
    setMode('custom')
    setConfig(custom)
    setState(initialTimerState(custom))
    setShowConfig(false)
  }

  const isRestPhase = state.phase === 'rest' || state.phase === 'roundRest'
  const phaseLabel =
    state.phase === 'work'
      ? t('timer.phase.work')
      : isRestPhase
        ? t('timer.phase.rest')
        : t('timer.phase.finished')
  const almostDone = state.isRunning && state.secondsRemaining > 0 && state.secondsRemaining <= 3
  const ringColor = almostDone
    ? 'var(--color-danger)'
    : isRestPhase
      ? 'var(--color-muted)'
      : 'var(--color-cta)'
  const roundsTotal = config.totalRounds > 0 ? config.totalRounds : '∞'

  return (
    <div ref={containerRef} style={{ opacity: 0 }} className="flex w-full flex-col items-center gap-3">
      <div className="flex w-full gap-1.5 overflow-x-auto pb-1">
        {modes.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => changeMode(m)}
            aria-pressed={mode === m}
            className={`min-h-11 shrink-0 rounded-full border px-3 text-[10px] font-semibold transition-colors ${
              mode === m
                ? 'border-gold/55 bg-gold/10 text-gold-bright'
                : 'border-border text-muted'
            }`}
          >
            {t(`timer.modes.${m}`)}
          </button>
        ))}
      </div>

      <TimerRing
        remaining={state.secondsRemaining}
        total={state.totalSeconds}
        mode="remaining"
        radius={100}
        strokeWidth={5}
        viewBox={214}
        color={ringColor}
        className="size-[214px]"
        pulse={almostDone}
        testId="timer-ring"
      >
        <span
          data-testid="timer-display"
          className={`font-display text-[54px] font-light leading-none tabular-nums ${
            almostDone ? 'text-danger' : 'text-fg'
          }`}
        >
          {formatDuration(state.secondsRemaining, settings.timerFormat)}
        </span>
        <span
          className={`mt-1 text-[8px] font-semibold uppercase tracking-[0.18em] ${
            almostDone ? 'text-danger' : isRestPhase ? 'text-muted' : 'text-gold'
          }`}
        >
          {phaseLabel}
        </span>
      </TimerRing>

      <div className="grid w-full grid-cols-3 divide-x divide-border/40 border-y border-border/40 py-2 text-center">
        <div className="px-2">
          <span className="kicker">{t('timer.round')}</span>
          <span className="mt-0.5 block font-display text-xl font-light tabular-nums text-fg">
            {state.totalRoundsCompleted}/{roundsTotal}
          </span>
        </div>
        <div className="px-2">
          <span className="kicker">{t('timer.elapsedLabel')}</span>
          <span className="mt-0.5 block font-display text-xl font-light tabular-nums text-fg">
            {formatDuration(state.elapsed, settings.timerFormat)}
          </span>
        </div>
        <div className="px-2">
          <span className="kicker">{t('timer.phaseLabel')}</span>
          <span className="mt-0.5 block font-display text-xl font-light text-fg">{phaseLabel}</span>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-4">
        <button
          type="button"
          onClick={reset}
          aria-label={t('timer.reset')}
          className="flex size-11 items-center justify-center rounded-full border border-border text-muted"
        >
          <RotateCcw className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={state.isRunning ? t('timer.pause') : t('timer.play')}
          className="flex size-16 items-center justify-center rounded-full bg-cta text-on-gold transition-transform active:scale-95"
        >
          {state.isRunning ? (
            <Pause className="size-7" aria-hidden />
          ) : (
            <Play className="size-7" fill="currentColor" aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={() => setShowConfig(true)}
          aria-label={t('timer.config.title')}
          className="flex size-11 items-center justify-center rounded-full border border-border text-muted"
        >
          <Settings className="size-5" aria-hidden />
        </button>
      </div>

      <p className="text-[10px] text-muted">
        {t('timer.summary', {
          work: config.workSeconds,
          rest: config.restSeconds,
          rounds: roundsTotal,
        })}
      </p>

      {showConfig && (
        <TimerConfigSheet
          config={config}
          onApply={applyConfig}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  )
}
