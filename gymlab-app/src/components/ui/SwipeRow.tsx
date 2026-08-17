// SwipeRow: contenedor con scroll horizontal y fade gradient automático que indica
// que hay más contenido a la derecha (solo visible cuando realmente desborda).
import { useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

export const SwipeRow = ({ children, className = '' }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Detecta desbordamiento y actualiza al hacer scroll o al redimensionar.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => setCanScrollRight(el.scrollWidth > el.clientWidth + 4)
    const raf = requestAnimationFrame(() => requestAnimationFrame(check))
    const ro = new ResizeObserver(check)
    ro.observe(el)
    el.addEventListener('scroll', check, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      el.removeEventListener('scroll', check)
    }
  }, [children])

  return (
    <div className="relative">
      <div ref={scrollRef} className={`overflow-x-auto ${className}`} style={{ scrollbarWidth: 'none' }}>
        {children}
      </div>
      {canScrollRight && (
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 rounded-r-lg"
          style={{ background: `linear-gradient(to left, var(--color-bg-elevated) 30%, transparent)` }}
          aria-hidden
        />
      )}
    </div>
  )
}
