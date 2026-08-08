// Hook que retrasa un valor hasta que deja de cambiar, útil para buscadores y entrada de texto.
import { useEffect, useState } from 'react'

// Devuelve el valor de entrada tras `delay` ms sin cambios (p. ej. para debounce en búsquedas).
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  return debounced
}
