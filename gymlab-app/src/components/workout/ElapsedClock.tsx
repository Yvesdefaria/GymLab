// Reloj en vivo de la sesión activa: muestra el tiempo transcurrido desde el inicio.
import { useEffect, useState } from 'react'
import { formatElapsedClock } from '@/domain/workouts'

type ElapsedClockProps = {
  startedAt: string | null
}

// Renderiza el tiempo de sesión transcurrido, refrescándose cada segundo.
export const ElapsedClock = ({ startedAt }: ElapsedClockProps) => {
  const [now, setNow] = useState(() => Date.now())

  // Sincroniza el reloj con el inicio de sesión y lo actualiza con un intervalo de 1s.
  useEffect(() => {
    if (!startedAt) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startedAt])

  if (!startedAt) return null

  return (
    <p className="stat-value mt-0.5 text-2xl tabular-nums">
      {formatElapsedClock((now - new Date(startedAt).getTime()) / 1000)}
    </p>
  )
}
