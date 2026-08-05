import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  value: number
  decimals?: number
  duration?: number
  className?: string
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export const CountUp = ({
  value,
  decimals = 0,
  duration = 700,
  className,
}: CountUpProps) => {
  const [display, setDisplay] = useState(value)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }
    const start = performance.now()
    const from = display
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setDisplay(from + (value - from) * easeOut(t))
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [value, duration])

  return (
    <span className={className} aria-hidden="true">
      {display.toLocaleString('es-ES', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  )
}
