// Timer de descanso con recomendación basada en ejercicio y objetivo.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, RotateCcw } from 'lucide-react'
import {
  type ExerciseCategory,
  type TrainingGoal,
  calcRestRecommendation,
} from '@/domain/restRecommendation'
import { formatTime } from '@/domain/roundTimer'
import { prefersReducedMotion } from '@/lib/animations'
import anime from 'animejs'

interface RestTimerProps {
  category?: ExerciseCategory
  goal?: TrainingGoal
  rpe?: number
  rir?: number
  onDone?: () => void
}

export const RestTimer = ({
  category = 'compuesto',
  goal = 'hipertrofia',
  rpe,
  rir,
  onDone,
}: RestTimerProps) => {
  const { t } = useTranslation()
  const rec = calcRestRecommendation(category, goal, rpe, rir)
  const [seconds, setSeconds] = useState(rec.recommendedSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset cuando cambian las props.
  useEffect(() => {
    const newRec = calcRestRecommendation(category, goal, rpe, rir)
    setSeconds(newRec.recommendedSeconds)
    setIsRunning(false)
  }, [category, goal, rpe, rir])

  // Beep y vibración al terminar.
  const playBeep = useCallback(() => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.value = 0.3
      osc.start()
      osc.stop(ctx.currentTime + 0.1)
    } catch { /* silent */ }
    if (navigator.vibrate) navigator.vibrate(200)
    onDone?.()
  }, [onDone])

  // Tick.
  useEffect(() => {
    if (!isRunning || seconds <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (isRunning && seconds <= 0) {
        setIsRunning(false)
        playBeep()
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev - 1)
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, seconds, playBeep])

  // Animación de entrada.
  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion()) return
    anime({
      targets: containerRef.current,
      opacity: [0, 1],
      duration: 200,
      easing: 'easeOutCubic',
    })
  }, [])

  const progress = rec.recommendedSeconds > 0 ? seconds / rec.recommendedSeconds : 0
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div ref={containerRef} className="flex items-center gap-3 rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2.5">
      {/* Mini círculo */}
      <svg className="size-12 shrink-0 -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="3" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="var(--color-warning)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-fg">{formatTime(seconds)}</p>
        <p className="text-[0.6rem] text-muted">
          {t('rest.recommended', { min: rec.minSeconds, max: rec.maxSeconds })}
        </p>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            const newRec = calcRestRecommendation(category, goal, rpe, rir)
            setSeconds(newRec.recommendedSeconds)
            setIsRunning(false)
          }}
          className="rounded-full bg-bg-elevated/50 p-1.5 text-muted"
          aria-label={t('timer.reset')}
        >
          <RotateCcw className="size-3.5" />
        </button>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="rounded-full bg-accent p-1.5 text-accent-fg"
          aria-label={isRunning ? t('timer.pause') : t('timer.play')}
        >
          {isRunning ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
      </div>
    </div>
  )
}
