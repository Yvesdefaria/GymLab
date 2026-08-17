// Hook global que permite arrastrar con el ratón cualquier contenedor con scroll de la página.
// Elegir el ancestro según la dirección del gesto: si se arrastra horizontalmente, prioriza el
// contenedor con scroll horizontal (carruseles); si vertical, el vertical más cercano.
import { useEffect } from 'react'

// Elementos con los que no se inicia el arrastre (controles interactivos).
const INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, [role="button"], [contenteditable], label, [data-no-drag]'

// Umbral de movimiento para considerar el gesto un arrastre y no un clic.
const MOVE_THRESHOLD = 4

type Candidate = {
  el: HTMLElement
  canH: boolean
  canV: boolean
}

type DragState = {
  candidates: Candidate[]
  el: HTMLElement | null
  x: number
  y: number
  sl: number
  st: number
  moved: boolean
  horizontal: boolean
  fromInteractive: boolean
}

// Un elemento es arrastrable si puede desplazarse de verdad: overflow auto/scroll
// con contenido sobrante, o el <html> (scroll de página). Evita falsos positivos
// de elementos con overflow:visible cuyo contenido simplemente se desborda.
const isScrollable = (el: HTMLElement): { canH: boolean; canV: boolean } => {
  const cs = getComputedStyle(el)
  const isDoc = el === document.documentElement
  const scrollableY = () => el.scrollHeight > el.clientHeight
  const scrollableX = () => el.scrollWidth > el.clientWidth
  const canV = isDoc ? scrollableY() : scrollableY() && /auto|scroll|overlay/.test(cs.overflowY)
  const canH = isDoc ? scrollableX() : scrollableX() && /auto|scroll|overlay/.test(cs.overflowX)
  return { canH, canV }
}

// Activa listeners globales que detectan el contenedor arrastrable más cercano y lo desplazan.
export const useGlobalDragScroll = () => {
  useEffect(() => {
    const state: DragState = { candidates: [], el: null, x: 0, y: 0, sl: 0, st: 0, moved: false, horizontal: false, fromInteractive: false }

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      const target = e.target as HTMLElement
      if (!(target instanceof Element)) return
      // Si el gesto empieza en un control (input/botón), el arrastre horizontal se permite
      // igualmente (carruseles con muchos inputs), pero un tap o gesto vertical siguen intactos.
      const fromInteractive = target.closest(INTERACTIVE_SELECTOR) !== null

      // Recoge todos los ancestros realmente scrollables (más cercano primero) para poder
      // elegir el eje tras ver la dirección del gesto (horizontal vs vertical).
      const candidates: Candidate[] = []
      let el: HTMLElement | null = target
      while (el) {
        const s = isScrollable(el)
        if (s.canH || s.canV) candidates.push({ el, canH: s.canH, canV: s.canV })
        el = el.parentElement
      }
      if (candidates.length === 0) return

      state.candidates = candidates
      state.el = null
      state.x = e.clientX
      state.y = e.clientY
      state.moved = false
      state.horizontal = false
      state.fromInteractive = fromInteractive
      document.body.classList.add('drag-scrolling')
      document.body.style.cursor = 'grabbing'
    }

    const onMove = (e: MouseEvent) => {
      if (state.candidates.length === 0) return
      const dx = e.clientX - state.x
      const dy = e.clientY - state.y
      if (!state.moved && Math.hypot(dx, dy) <= MOVE_THRESHOLD) return
      // Fija el eje (horizontal si domina el desplazamiento X) en el primer movimiento real.
      if (!state.moved) {
        state.moved = true
        state.horizontal = Math.abs(dx) > Math.abs(dy)
        // Desde un control interactivo solo se arrastra en horizontal (carruseles); un gesto
        // vertical se abandona para no interferir con el scroll del slide ni el control.
        if (state.fromInteractive && !state.horizontal) {
          state.candidates = []
          document.body.classList.remove('drag-scrolling')
          document.body.style.cursor = ''
          return
        }
        const pick = state.candidates.find((c) => (state.horizontal ? c.canH : c.canV))
        state.el = pick?.el ?? null
        if (!state.el) {
          state.candidates = []
          document.body.classList.remove('drag-scrolling')
          document.body.style.cursor = ''
          return
        }
        state.sl = state.el.scrollLeft
        state.st = state.el.scrollTop
        // Si el arrastre empezó en un input, lo desenfoca para no abrir el teclado al deslizar.
        if (state.fromInteractive) {
          const ae = document.activeElement as HTMLElement | null
          if (ae && /input|textarea|select/i.test(ae.tagName)) ae.blur()
        }
      }
      if (!state.el) return
      if (state.horizontal) state.el.scrollLeft = state.sl - dx
      else state.el.scrollTop = state.st - dy
      e.preventDefault()
    }

    const onUp = (e: MouseEvent) => {
      if (state.candidates.length === 0) return
      const wasDrag = state.moved && state.fromInteractive
      state.candidates = []
      state.el = null
      document.body.classList.remove('drag-scrolling')
      document.body.style.cursor = ''
      // Tras un arrastre que empezó en un control, suprime el clic que el navegador dispararía
      // al soltar (p. ej. activar un botón o desplazar el foco en un input) en una sola vez.
      if (wasDrag) {
        e.preventDefault()
        const suppress = (ce: MouseEvent) => {
          ce.preventDefault()
          ce.stopPropagation()
          document.removeEventListener('click', suppress, true)
        }
        document.addEventListener('click', suppress, true)
      }
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
