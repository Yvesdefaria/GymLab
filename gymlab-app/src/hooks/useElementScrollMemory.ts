// Memoria de scroll de un contenedor interno (F134/T4).
// Guarda en cada scroll con rAF (O(1), sin estado de React) y NO en el cleanup:
// React ejecuta el cleanup del layout effect después de pintar el contenido nuevo,
// así que leer `scrollTop` ahí devuelve la posición recortada al alto del contenido
// nuevo (0 cuando no scrollea) y borraría el día anterior.
import { useLayoutEffect, useRef } from 'react'
import { readScroll, saveScroll } from '@/lib/scrollMemory'

export const useElementScrollMemory = (key: string) => {
  const ref = useRef<HTMLDivElement>(null)
  const restoreTarget = readScroll(key)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollTop = restoreTarget

    let frame = 0
    const onScroll = () => {
      if (frame !== 0) return
      frame = requestAnimationFrame(() => {
        frame = 0
        saveScroll(key, el.scrollTop)
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame)
      el.removeEventListener('scroll', onScroll)
    }
  }, [key, restoreTarget])

  return ref
}
