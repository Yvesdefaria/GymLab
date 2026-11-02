// Storage de Zustand `persist` con escritura diferida.
// Cada tecla dispara set() → persist → setItem; serializar y escribir a localStorage
// en cada pulsación era el cuello de botella del tecleo (tarea 91.2, extraído a lib
// en F134/T2). Se difiere la escritura con un timer y se fuerza el flush al
// cerrar/ocultar la app para no perder nunca el último estado; el JSON guardado
// mantiene el formato {state, version} para que la rehidratación sea idéntica.
import type { PersistStorage, StorageValue } from 'zustand/middleware'
import { logger } from '@/lib/logger'

export const PERSIST_DEBOUNCE_MS = 400

type Options = {
  // Etiqueta de la traza cuando la escritura falla (cuota u otro error de storage).
  label: string
  debounceMs?: number
}

export const createDebouncedPersistStorage = <T>({
  label,
  debounceMs = PERSIST_DEBOUNCE_MS,
}: Options): PersistStorage<T> => {
  let pendingName = ''
  let pendingValue: StorageValue<T> | null = null
  let persistTimer: ReturnType<typeof setTimeout> | null = null

  // Escribe ahora mismo el valor pendiente (si lo hay) en localStorage.
  const flush = () => {
    if (persistTimer !== null) {
      clearTimeout(persistTimer)
      persistTimer = null
    }
    if (pendingValue === null) return
    try {
      localStorage.setItem(pendingName, JSON.stringify(pendingValue))
    } catch (error) {
      // Cuota u otro error de storage: se ignora (como Zustand), pero queda traza.
      logger.error(label, 'no se pudo persistir el estado diferido', { error })
    }
    pendingValue = null
  }

  const storage: PersistStorage<T> = {
    getItem: (name) => {
      const raw = localStorage.getItem(name)
      return raw === null ? null : (JSON.parse(raw) as StorageValue<T>)
    },
    setItem: (name, value) => {
      pendingName = name
      pendingValue = value
      if (persistTimer !== null) clearTimeout(persistTimer)
      persistTimer = setTimeout(flush, debounceMs)
    },
    removeItem: (name) => {
      // Flush primero: un timer pendiente recrearía la clave vacía al dispararse.
      flush()
      localStorage.removeItem(name)
    },
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
  }

  return storage
}
