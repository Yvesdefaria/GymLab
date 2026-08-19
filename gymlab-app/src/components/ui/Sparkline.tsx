// Sparkline SVG inline: mini-gráfico de tendencia con dibujado animado vía anime.js.
import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/lib/animations'
import anime from 'animejs'

type Props = {
  data: number[]
  color?: string
  height?: number
  width?: number
}

export const Sparkline = ({
  data,
  color = 'var(--color-accent)',
  height = 32,
  width = 80,
}: Props) => {
  const lineRef = useRef<SVGPolylineElement>(null)

  useEffect(() => {
    if (prefersReducedMotion() || !lineRef.current) return
    const el = lineRef.current
    const length = el.getTotalLength?.() ?? 200
    el.style.strokeDasharray = String(length)
    el.style.strokeDashoffset = String(length)
    anime({
      targets: el,
      strokeDashoffset: [length, 0],
      duration: 600,
      easing: 'easeInOutSine',
    })
  }, [data])

  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      aria-hidden
    >
      <polyline
        ref={lineRef}
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
