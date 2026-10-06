// Repintado local del descanso (F103/T5): el restante se deriva del deadline en
// cada render y el tick de 1 Hz sólo fuerza el repintado, sin pasar por el store
// ni por la persistencia. El único set al store es la transición de fin.
import { useEffect, useState } from 'react'
import { remainingSeconds } from '@/domain/countdown'

export const REST_TICK_MS = 1000

// Programa el tick y devuelve su cleanup. Al vencer el deadline llama a
// `onExpire` y se detiene solo: no puede quedar escribiendo al store por segundo.
export const startRestCountdownTick = (
  endsAt: number,
  totalSeconds: number,
  onTick: () => void,
  onExpire: () => void
): (() => void) => {
  const countdown = { endsAt, pausedRemaining: null, totalSeconds }
  let stopped = false
  const id = setInterval(() => {
    if (stopped) return
    if (remainingSeconds(countdown) > 0) {
      onTick()
      return
    }
    stopped = true
    clearInterval(id)
    onExpire()
  }, REST_TICK_MS)
  return () => {
    stopped = true
    clearInterval(id)
  }
}

// Cuenta de descanso del componente: devuelve el restante derivado del deadline
// y mantiene el repintado de 1 Hz mientras siga activo.
export const useRestCountdown = (
  isResting: boolean,
  endsAt: number | null,
  totalSeconds: number,
  onExpire: () => void
): number => {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!isResting || endsAt === null) return
    return startRestCountdownTick(endsAt, totalSeconds, () => setTick((t) => t + 1), onExpire)
  }, [isResting, endsAt, totalSeconds, onExpire])

  if (!isResting || endsAt === null) return 0
  return remainingSeconds({ endsAt, pausedRemaining: null, totalSeconds })
}
