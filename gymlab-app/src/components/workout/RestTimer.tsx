import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useSettings } from '@/hooks/useSettings'
import { playRestEndSound, vibrate } from '@/lib/feedback'

const PRESETS = [30, 60, 90, 120, 180]
const R = 52
const CIRC = 2 * Math.PI * R

export const RestTimer = () => {
  const { restRemaining, restSeconds, isResting, startRest, tickRest, stopRest, setRestSeconds } =
    useActiveWorkoutStore()
  const { settings } = useSettings()
  const hitZeroRef = useRef(false)
  const [justFinished, setJustFinished] = useState(false)

  useEffect(() => {
    if (!isResting) return
    const id = setInterval(tickRest, 1000)
    return () => clearInterval(id)
  }, [isResting, tickRest])

  useEffect(() => {
    if (isResting && restRemaining === 0) {
      hitZeroRef.current = true
      return
    }
  }, [isResting, restRemaining])

  useEffect(() => {
    if (isResting) {
      hitZeroRef.current = false
      setJustFinished(false)
      return
    }
    if (hitZeroRef.current) {
      hitZeroRef.current = false
      setJustFinished(true)
      if (settings.restSound) playRestEndSound()
      if (settings.restVibrate) vibrate([200, 100, 200])
    }
  }, [isResting, settings.restSound, settings.restVibrate])

  const progress = restSeconds > 0 ? (restSeconds - restRemaining) / restSeconds : 0
  const pct = Math.min(progress, 1)
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
          Descanso
        </h3>
        <span className={`kicker ${almostDone ? '!text-danger' : ''}`}>
          {countdown > 0 ? `${countdown}s` : 'Listo'}
        </span>
      </div>

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
            {countdown > 0 ? countdown : 'OK'}
          </span>
        </div>
      </div>

      {justFinished && (
        <p
          className="mb-3 text-center text-sm font-medium text-cta"
          aria-live="polite"
        >
          Vuelve a por la siguiente
        </p>
      )}

      <div className="mb-3 flex gap-2">
        {PRESETS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setRestSeconds(s)
              if (isResting) startRest()
            }}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              restSeconds === s
                ? 'border border-cta bg-cta/20 text-accent-soft'
                : 'border border-border bg-bg text-muted hover:border-cta hover:text-accent-soft'
            }`}
          >
            {s >= 60 ? `${s / 60}m` : `${s}s`}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {!isResting ? (
          <button
            onClick={startRest}
            className="gold-gradient flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl text-on-gold font-medium transition-opacity hover:opacity-90"
          >
            <Play className="size-4" fill="currentColor" />
            Iniciar descanso
          </button>
        ) : (
          <>
            <button
              onClick={stopRest}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-bg text-fg font-medium transition-colors hover:border-cta"
            >
              <Pause className="size-4" />
              Pausar
            </button>
            <button
              onClick={() => {
                stopRest()
                startRest()
              }}
              aria-label="Reiniciar descanso"
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
