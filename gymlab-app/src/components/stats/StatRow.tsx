// StatRow + AnimatedCountUp: fila de métricas resumen con números que animan al valor real.
import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { SwipeRow } from '@/components/ui/SwipeRow'

export type StatItem = {
  value: number
  label: string
  format?: 'number' | 'decimal' | 'percent' | 'volume'
  prefix?: string
  suffix?: string
  trend?: number // % change vs previous period
}

type StatRowProps = {
  stats: StatItem[]
}

const formatValue = (v: number, format: StatItem['format']): string => {
  switch (format) {
    case 'decimal':
      return v.toFixed(1)
    case 'percent':
      return `${Math.round(v)}%`
    case 'volume':
      return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v))
    default:
      return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v))
  }
}

const AnimatedCountUp = ({ value, format }: { value: number; format: StatItem['format'] }) => {
  const [displayed, setDisplayed] = useState(0)
  const ref = useRef<number | null>(null)
  const prefersReduced = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (prefersReduced.current) {
      setDisplayed(value)
      return
    }

    const start = performance.now()
    const duration = 600

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(eased * value)
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate)
      }
    }

    ref.current = requestAnimationFrame(animate)
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current)
    }
  }, [value])

  return <span>{formatValue(displayed, format)}</span>
}

const trendIcon = (trend: number) => {
  if (trend > 0) return <TrendingUp className="size-3" />
  if (trend < 0) return <TrendingDown className="size-3" />
  return <Minus className="size-3" />
}

const trendColor = (trend: number) => {
  if (trend > 0) return 'text-success'
  if (trend < 0) return 'text-danger'
  return 'text-muted'
}

export const StatRow = ({ stats }: StatRowProps) => {
  return (
    <SwipeRow className="flex gap-3">
      {stats.map((stat, i) => (
        <div key={i} className="flex min-w-[80px] flex-shrink-0 flex-col items-center gap-0.5 rounded-xl bg-white/5 px-3 py-2">
        <span className="text-xl font-bold tabular-nums text-gold">
          {stat.prefix}
          <AnimatedCountUp value={stat.value} format={stat.format} />
          {stat.suffix}
        </span>
        <span className="text-[0.65rem] leading-tight text-muted uppercase tracking-wider">{stat.label}</span>
        {stat.trend != null && stat.trend !== 0 && (
          <span className={`flex items-center gap-0.5 text-[0.6rem] font-medium ${trendColor(stat.trend)}`}>
            {trendIcon(stat.trend)}
            {stat.trend > 0 ? '+' : ''}{Math.round(stat.trend)}%
          </span>
        )}
      </div>
    ))}
    </SwipeRow>
  )
}
