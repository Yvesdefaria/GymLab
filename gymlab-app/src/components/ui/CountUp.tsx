// Anima un número desde su valor previo hasta `value` usando requestAnimationFrame.
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

interface CountUpProps {
  value: number
  decimals?: number
  duration?: number
  className?: string
}

// Curva de easing para un descenso de velocidad suave al final de la animación.
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

// Contador animado; respeta prefers-reduced-motion mostrando el valor final sin transición.
export const CountUp = ({
  value,
  decimals = 0,
  duration = 700,
  className,
}: CountUpProps) => {
  const { i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [display, setDisplay] = useState(value)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    // Sin animación para usuarios con movimiento reducido: salta directo al destino.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }
    const start = performance.now()
    const from = display
    // Interpola desde el valor visible previo para no "reiniciar" el contador en cada cambio.
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setDisplay(from + (value - from) * easeOut(t))
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    // Cancela la animación si el componente se desmonta o cambia el destino.
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [value, duration])

  return (
    <span className={className} aria-hidden="true">
      {formatNumber(display, lang, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  )
}
