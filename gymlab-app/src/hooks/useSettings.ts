// Hooks de configuración de la app y de bloqueo de pantalla durante la sesión.
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { metaRepo } from '@/data/repositories'
import {
  DEFAULT_SETTINGS,
  SETTINGS_META_KEY,
  type AppSettings,
} from '@/domain/settings'

// Lee los ajustes persistidos fusionándolos con los valores por defecto y permite actualizarlos.
export const useSettings = () => {
  const stored = useLiveQuery(
    () => metaRepo.getJson<Partial<AppSettings>>(SETTINGS_META_KEY, {}),
    []
  )

  const settings = useMemo<AppSettings>(
    () => ({ ...DEFAULT_SETTINGS, ...stored }),
    [stored]
  )

  const update = useCallback(
    async (patch: Partial<AppSettings>) => {
      const next = { ...settings, ...patch }
      await metaRepo.setJson(SETTINGS_META_KEY, next)
    },
    [settings]
  )

  return { settings, update }
}

// Mantiene la pantalla despierta mientras `enabled` sea true (p. ej. durante un entrenamiento).
export const useWakeLock = (enabled: boolean) => {
  const sentinel = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    let cancelled = false
    // Libera el bloqueo de pantalla si estaba activo.
    const release = async () => {
      try {
        await sentinel.current?.release()
      } catch {
        /* ignore */
      }
      sentinel.current = null
    }
    const acquire = async () => {
      if (!('wakeLock' in navigator)) return
      try {
        sentinel.current = await navigator.wakeLock.request('screen')
        sentinel.current.addEventListener('release', () => {
          if (!cancelled) sentinel.current = null
        })
      } catch {
        /* ignore */
      }
    }
    if (enabled) void acquire()
    else void release()
    const onVisibility = () => {
      if (enabled && document.visibilityState === 'visible') void acquire()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      void release()
    }
  }, [enabled])
}
