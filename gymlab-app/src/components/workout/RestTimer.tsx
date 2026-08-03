import { useEffect } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'

const PRESETS = [30, 60, 90, 120, 180]

export const RestTimer = () => {
  const { restRemaining, restSeconds, isResting, startRest, tickRest, stopRest, setRestSeconds } =
    useActiveWorkoutStore()

  useEffect(() => {
    if (!isResting || restRemaining <= 0) return
    const id = setInterval(tickRest, 1000)
    return () => clearInterval(id)
  }, [isResting, restRemaining, tickRest])

  const progress = restSeconds > 0 ? ((restSeconds - restRemaining) / restSeconds) * 100 : 0
  const pct = Math.min(progress, 100)

  return (
    <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
          Descanso
        </h3>
        {isResting && (
          <span className="font-display text-2xl font-bold text-fg">
            {restRemaining}s
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-cta transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Preset buttons */}
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

      {/* Controls */}
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
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-bg px-4 text-muted transition-colors hover:border-cta hover:text-accent-soft"
            >
              <RotateCcw className="size-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
