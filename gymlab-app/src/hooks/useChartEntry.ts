// Hook que anima los elementos SVG de un gráfico Recharts al montar o cuando cambian los datos.
// Usa drawOn (stroke-dashoffset) para líneas/áreas, staggerFade para barras y fadeIn para donuts.
// Respeta prefers-reduced-motion: en ese caso settle/ensureVisible deja todo visible sin animar.
import { useEffect, useRef, type RefObject } from 'react'
import { drawOn, fadeIn, staggerFade, prefersReducedMotion, ensureVisible } from '@/lib/animations'

export type ChartType = 'area' | 'line' | 'bar' | 'donut'

// Selectores SVG que Recharts genera para cada tipo de gráfico.
const SELECTORS: Record<ChartType, string[]> = {
  area: ['path.recharts-area-area', 'path.recharts-area-curve'],
  line: ['path.recharts-line-curve'],
  bar: ['path.recharts-bar-rectangle'],
  donut: ['path.recharts-pie-sector'],
}

// Anima los elementos del tipo indicado dentro del contenedor referenciado.
// replayKey permite re-disparar la animación cuando cambian los datos.
export const useChartEntry = (
  ref: RefObject<HTMLElement | null>,
  type: ChartType,
  replayKey?: unknown,
): void => {
  const animRef = useRef<(() => void) | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Limpia animación anterior si existe.
    animRef.current?.()

    // Doble rAF para asegurar que Recharts terminó de renderizar el SVG.
    let cancelled = false
    const raf1 = requestAnimationFrame(() => {
      if (cancelled) return
      rafRef.current = requestAnimationFrame(() => {
        if (cancelled || !ref.current) return

        const selectors = SELECTORS[type]
        const targets: Element[] = []

        for (const selector of selectors) {
          const found = ref.current.querySelectorAll(selector)
          if (found.length > 0) {
            targets.push(...Array.from(found))
            break
          }
        }

        if (targets.length === 0) return

        if (prefersReducedMotion()) {
          ensureVisible(targets)
          return
        }

        let cleanup: (() => void) | null = null

        if (type === 'area' || type === 'line') {
          const anim = drawOn(targets, { duration: 800 })
          cleanup = () => anim?.pause()
        } else if (type === 'bar') {
          const anim = staggerFade(targets, { staggerDelay: 25, duration: 400, easing: 'easeOutCubic' })
          cleanup = () => anim?.pause()
        } else if (type === 'donut') {
          const anim = fadeIn(targets, { duration: 600 })
          cleanup = () => anim?.pause()
        }

        animRef.current = cleanup ?? null
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf1)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      animRef.current?.()
      animRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, type, replayKey])
}