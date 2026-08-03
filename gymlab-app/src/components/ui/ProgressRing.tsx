type ProgressRingProps = {
  value: number
  size?: number
  stroke?: number
  label?: string
  className?: string
}

export const ProgressRing = ({
  value,
  size = 88,
  stroke = 8,
  label,
  className = '',
}: ProgressRingProps) => {
  const pct = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `Progreso ${pct}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-cta transition-[stroke-dashoffset] duration-300"
        />
      </svg>
      <span className="absolute font-display text-lg font-bold text-accent">{pct}%</span>
    </div>
  )
}
