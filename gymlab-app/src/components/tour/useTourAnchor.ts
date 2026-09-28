// F101: espera el ancla del paso (data-tour) y devuelve su rect en viewport.
import { useEffect, useState } from 'react'

export type AnchorRect = { top: number; left: number; width: number; height: number } | null

const waitForAnchor = (anchor: string, timeoutMs = 1000): Promise<HTMLElement | null> =>
  new Promise((resolve) => {
    const started = Date.now()
    const tick = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${anchor}"]`)
      if (el) return resolve(el)
      if (Date.now() - started > timeoutMs) return resolve(null)
      requestAnimationFrame(tick)
    }
    tick()
  })

// null = globo centrado: paso sin ancla, o ancla que no aparece (degradación elegante).
export const useTourAnchor = (anchor: string | undefined, stepId: string, active: boolean): AnchorRect => {
  const [rect, setRect] = useState<AnchorRect>(null)

  useEffect(() => {
    setRect(null)
    if (!active) return
    let el: HTMLElement | null = null
    let alive = true
    const measure = () => {
      if (!el) return
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    const start = async () => {
      el = anchor ? await waitForAnchor(anchor) : null
      if (!alive || !el) return
      el.scrollIntoView({ block: 'center', behavior: 'auto' })
      measure()
    }
    void start()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      alive = false
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [anchor, stepId, active])

  return rect
}
