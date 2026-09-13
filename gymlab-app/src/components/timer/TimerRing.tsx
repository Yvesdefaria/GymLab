// Anillo de progreso compartido por descanso, rondas y calentamiento (F96, D1).
// La fracción se deriva del mismo par (restante, total) que el número mostrado,
// así que el anillo no puede divergir del valor.
import type { ReactNode } from 'react'
import { countdownFraction, type ProgressMode } from '@/domain/countdown'

interface TimerRingProps {
  remaining: number
  total: number
  // 'elapsed' = se rellena al consumir (descanso); 'remaining' = se vacía (rondas/calentamiento).
  mode?: ProgressMode
  radius?: number
  strokeWidth?: number
  viewBox?: number
  color?: string
  trackColor?: string
  className?: string
  // Pulso de aviso cuando la cuenta está por terminar.
  pulse?: boolean
  children?: ReactNode
}

export const TimerRing = ({
  remaining,
  total,
  mode = 'elapsed',
  radius = 52,
  strokeWidth = 7,
  viewBox = 120,
  color = 'var(--color-cta)',
  trackColor = 'var(--color-border)',
  className = 'size-28',
  pulse = false,
  children,
}: TimerRingProps) => {
  const circumference = 2 * Math.PI * radius
  const center = viewBox / 2
  const offset = circumference * (1 - countdownFraction(remaining, total, mode))

  return (
    <div className={`relative ${className}`}>
      <svg viewBox={`0 0 ${viewBox} ${viewBox}`} className="size-full -rotate-90" aria-hidden="true">
        <circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={
            pulse
              ? 'animate-timer-peak'
              : 'transition-[stroke-dashoffset] duration-1000 ease-linear'
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
