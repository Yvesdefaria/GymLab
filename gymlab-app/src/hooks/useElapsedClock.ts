// F132.2/B2 — reloj vivo de la sesión para el kicker del header.
// Extraído de ElapsedClock para poder renderizar el tiempo como texto (kicker)
// sin duplicar el intervalo de 1 s.
import { useEffect, useState } from 'react'
import { formatElapsedClock } from '@/domain/workouts'

export const useElapsedClock = (startedAt: string | null): string | null => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!startedAt) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startedAt])

  if (!startedAt) return null
  return formatElapsedClock((now - new Date(startedAt).getTime()) / 1000)
}
