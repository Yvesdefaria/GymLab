// Hook que permite arrastrar horizontalmente (drag) un contenedor con scroll, sin interferir con clics.
import { useEffect, useRef, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react'

// Convierte un contenedor en arrastrable con el ratón: desplaza scrollLeft mientras se arrastra.
export const useDragToScroll = () => {
  const ref = useRef<HTMLDivElement | null>(null)
  const state = useRef({ active: false, startX: 0, startScroll: 0, moved: false })
  const suppressClick = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onMove = (e: PointerEvent) => {
      const s = state.current
      if (!s.active) return
      // Solo marca el gesto como arrastre cuando supera un umbral, para no confundir con un clic.
      const dx = e.clientX - s.startX
      if (Math.abs(dx) > 4) s.moved = true
      el.scrollLeft = s.startScroll - dx
    }

    const onUp = () => {
      if (!state.current.active) return
      // Tras un arrastre real se suprime el clic siguiente para no disparar acciones al soltar.
      if (state.current.moved) {
        suppressClick.current = true
        window.setTimeout(() => {
          suppressClick.current = false
        }, 0)
      }
      state.current.active = false
      state.current.moved = false
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Solo el ratón arrastra; el táctil usa el scroll nativo.
    if (e.pointerType !== 'mouse') return
    const el = ref.current
    if (!el) return
    state.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false }
  }

  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    // Cancela el clic si hubo arrastre previo (ver suppressClick en onUp).
    if (suppressClick.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return { ref, onPointerDown, onClickCapture }
}
