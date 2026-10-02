// F101: espera el ancla del paso (data-tour) y devuelve su rect en viewport.
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export type AnchorRect = { top: number; left: number; width: number; height: number } | null

// Rect atado al paso dueño: nunca se devuelve el rect de un paso anterior mientras
// el ancla nueva todavía no se midió (fantasma con la transición de 200ms).
type AnchorState = { stepId: string; rect: NonNullable<AnchorRect> }

// Poll persistente mientras el paso siga activo: rAF en la ventana inicial (montajes
// rápidos) y luego un intervalo lento de vigilancia (chunks lazy, datos async).
// Sin timeout terminal: el ancla puede montar tarde y se sigue buscando.
const RAPID_POLL_MS = 2000
const SLOW_POLL_MS = 250
// Medición diferida tras la primera: layouts tardíos (imágenes, listas, fuentes).
const DEFERRED_MEASURE_MS = 600

const findAnchor = (anchor: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-tour="${anchor}"]`)

// null = globo centrado: paso sin ancla, o ancla que aún no existe (degradación elegante).
export const useTourAnchor = (anchor: string | undefined, stepId: string, active: boolean): AnchorRect => {
  const [state, setState] = useState<AnchorState | null>(null)
  // pathname re-arma la búsqueda si la ruta cambia (navegación manual o del tour).
  const { pathname } = useLocation()

  useEffect(() => {
    if (!active || !anchor) return
    let el: HTMLElement | null = null
    let bound: HTMLElement | null = null
    let alive = true
    let rafId = 0
    let intervalId = 0
    let deferredId = 0
    const rapidUntil = Date.now() + RAPID_POLL_MS

    const measure = () => {
      if (!alive) return
      // Guarda de conexión: el nodo pudo quedar desconectado (remontaje, «atrás»).
      // Si hay una instancia nueva de la misma ancla, se re-engancha y se re-scrollea.
      if (el && !el.isConnected) {
        el = findAnchor(anchor)
        if (el) {
          bind(el)
          el.scrollIntoView({ block: 'center', behavior: 'auto' })
        }
      }
      if (!el) return
      const r = el.getBoundingClientRect()
      setState({ stepId, rect: { top: r.top, left: r.left, width: r.width, height: r.height } })
    }

    const unbind = () => {
      if (!bound) return
      bound.removeEventListener('animationend', measure)
      bound.removeEventListener('transitionend', measure)
      bound = null
    }

    // Re-mide cuando el ancla termina de animarse (p. ej. las entradas `.reveal`).
    const bind = (node: HTMLElement) => {
      if (bound === node) return
      unbind()
      bound = node
      bound.addEventListener('animationend', measure)
      bound.addEventListener('transitionend', measure)
    }

    const attach = (found: HTMLElement) => {
      el = found
      bind(found)
      found.scrollIntoView({ block: 'center', behavior: 'auto' })
      measure()
      window.clearTimeout(deferredId)
      deferredId = window.setTimeout(measure, DEFERRED_MEASURE_MS)
    }

    const search = () => {
      if (!alive || el) return
      const found = findAnchor(anchor)
      if (found) attach(found)
    }

    // Vigilancia: reintenta si aún no está y re-engancha si el nodo se desconectó.
    const watch = () => {
      if (!alive) return
      if (el?.isConnected) return
      if (el) {
        unbind()
        el = null
      }
      search()
    }

    const tickRapid = () => {
      if (!alive || el) return
      search()
      if (!el && Date.now() < rapidUntil) rafId = requestAnimationFrame(tickRapid)
    }

    search()
    if (!el) rafId = requestAnimationFrame(tickRapid)
    intervalId = window.setInterval(watch, SLOW_POLL_MS)

    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    // Fuentes web: el ancla puede cambiar de tamaño cuando las fuentes se asientan.
    void document.fonts?.ready.then(measure)

    return () => {
      alive = false
      cancelAnimationFrame(rafId)
      window.clearInterval(intervalId)
      window.clearTimeout(deferredId)
      unbind()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [anchor, stepId, active, pathname])

  // Jamás devolver el rect de otro paso.
  return active && state && state.stepId === stepId ? state.rect : null
}
