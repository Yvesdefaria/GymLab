// Hook global que permite arrastrar con el ratón cualquier contenedor con scroll de la página.
import { useEffect } from 'react'

// Elementos con los que no se inicia el arrastre (controles interactivos).
const INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, [role="button"], [contenteditable], label, [data-no-drag]'

// Umbral de movimiento para considerar el gesto un arrastre y no un clic.
const MOVE_THRESHOLD = 4

type DragState = {
  el: HTMLElement | null
  x: number
  y: number
  sl: number
  st: number
  canH: boolean
  canV: boolean
  moved: boolean
}

// Activa listeners globales que detectan el contenedor arrastrable más cercano y lo desplazan.
export const useGlobalDragScroll = () => {
  useEffect(() => {
    const state: DragState = { el: null, x: 0, y: 0, sl: 0, st: 0, canH: false, canV: false, moved: false }

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      const target = e.target as HTMLElement
      if (!(target instanceof Element) || target.closest(INTERACTIVE_SELECTOR)) return

      // Sube por el DOM hasta encontrar el ancestro más cercano con scroll.
      let el: HTMLElement | null = target
      while (el && el !== document.body) {
        if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) break
        el = el.parentElement
      }
      if (!el) return

      state.el = el
      state.x = e.clientX
      state.y = e.clientY
      state.sl = el.scrollLeft
      state.st = el.scrollTop
      state.canH = el.scrollWidth > el.clientWidth
      state.canV = el.scrollHeight > el.clientHeight
      state.moved = false
      document.body.classList.add('drag-scrolling')
      document.body.style.cursor = 'grabbing'
    }

    const onMove = (e: MouseEvent) => {
      if (!state.el) return
      const dx = e.clientX - state.x
      const dy = e.clientY - state.y
      if (!state.moved && Math.hypot(dx, dy) <= MOVE_THRESHOLD) return
      state.moved = true
      if (state.canH) state.el.scrollLeft = state.sl - dx
      if (state.canV) state.el.scrollTop = state.st - dy
      e.preventDefault()
    }

    const onUp = () => {
      if (!state.el) return
      state.el = null
      document.body.classList.remove('drag-scrolling')
      document.body.style.cursor = ''
    }

    document.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])
}
