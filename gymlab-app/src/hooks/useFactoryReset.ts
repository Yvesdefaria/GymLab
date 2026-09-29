// Hook delgado del reset de fábrica (112.1): expone busy/error y dispara el wipe.
import { useCallback, useState } from 'react'
import { performFactoryReset } from '@/data/factoryReset'

export const useFactoryReset = () => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  const clearError = useCallback(() => setError(false), [])

  const run = useCallback(async () => {
    setBusy(true)
    setError(false)
    try {
      // Si sale bien, performFactoryReset recarga la app y este estado se descarta.
      await performFactoryReset()
    } catch {
      // La transacción es atómica: no se borró nada a medias y se puede reintentar.
      setError(true)
      setBusy(false)
    }
  }, [])

  return { run, busy, error, clearError }
}
