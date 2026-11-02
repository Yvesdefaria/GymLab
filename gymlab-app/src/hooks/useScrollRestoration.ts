// Restauración de scroll por pantalla (F134/T4).
// Guarda en un listener de scroll pasivo con rAF: es O(1) por frame y NO toca estado
// de React (antipatrón prohibido: docs/performance-audit-2026-10-05-features-nuevas.md).
// Restaura en `useLayoutEffect` y reintenta unos frames mientras el contenido termina
// de crecer (Dexie, chunks lazy), con el alto real como tope.
import { useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { readScroll, saveScroll, scrollKeyFor } from '@/lib/scrollMemory'

// ~0.5 s a 60 fps: suficiente para que cargue una lista desde IndexedDB.
const MAX_RESTORE_FRAMES = 30

export const useScrollRestoration = (ready = true) => {
  const { pathname, search } = useLocation()
  const key = scrollKeyFor(pathname, search)

  useEffect(() => {
    let frame = 0
    const save = () => saveScroll(key, window.scrollY)
    const onScroll = () => {
      if (frame !== 0) return
      frame = requestAnimationFrame(() => {
        frame = 0
        save()
      })
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') save()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [key])

  useLayoutEffect(() => {
    if (!ready) return
    const target = readScroll(key)
    if (target <= 0) return

    let frame = 0
    let attempts = 0
    const restore = () => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      window.scrollTo(0, Math.min(target, max))
      attempts += 1
      // Si el documento todavía es más corto que el destino, el contenido sigue cargando.
      if (max < target && attempts < MAX_RESTORE_FRAMES) frame = requestAnimationFrame(restore)
    }
    restore()
    return () => cancelAnimationFrame(frame)
  }, [key, ready])
}
