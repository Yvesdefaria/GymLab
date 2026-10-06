// F103/T3: estado del arranque dividido. `idle` = arranque mínimo (Ajustes +
// idioma) aún en curso; `seeding` = seed en segundo plano; `ready` = contenido
// habilitado; `error` = fallo recuperable (el gate ofrece reintento).
import type { AppLanguage } from '@/domain/onboarding'

export type SeedingStatus = 'idle' | 'seeding' | 'ready' | 'error'

export interface SeedingState {
  // true recién cuando el arranque mínimo terminó (idioma aplicado).
  booted: boolean
  status: SeedingStatus
  error: string | null
}

// Dependencias inyectables: el store queda puro y testeable sin Dexie ni React.
export interface SeedingDeps {
  loadSettings: () => Promise<{ language?: AppLanguage }>
  applyLanguage: (lang: AppLanguage) => Promise<void>
  // Fast path: si el seed ya está al día no se descarga el chunk del reseeder.
  isSeedCurrent: () => Promise<boolean>
  ensureProfile: () => Promise<void>
  runReseed: () => Promise<void>
  logError: (message: string, error: unknown) => void
}

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : 'Error al cargar'

export const createSeedingStore = (deps: SeedingDeps) => {
  let state: SeedingState = { booted: false, status: 'idle', error: null }
  let running: Promise<void> | null = null
  const listeners = new Set<() => void>()

  const publish = (patch: Partial<SeedingState>) => {
    state = { ...state, ...patch }
    for (const listener of listeners) listener()
  }

  // Arranque mínimo: una lectura de Ajustes + idioma antes del primer pintado
  // (evita el parpadeo de idioma al arrancar).
  const minimalBoot = async () => {
    const stored = await deps.loadSettings()
    await deps.applyLanguage(stored.language ?? 'es')
    publish({ booted: true })
  }

  // Seed en segundo plano: rama rápida (perfil) o reseed pesado.
  const runSeed = async () => {
    publish({ status: 'seeding', error: null })
    try {
      if (await deps.isSeedCurrent()) {
        await deps.ensureProfile()
      } else {
        await deps.runReseed()
      }
      publish({ status: 'ready' })
    } catch (error) {
      deps.logError('falló la preparación de datos', error)
      running = null
      publish({ status: 'error', error: messageOf(error) })
    }
  }

  // Guarda única: StrictMode o una doble llamada reutilizan la misma corrida.
  const prepare = (): Promise<void> => {
    if (running) return running
    if (state.status === 'ready') return Promise.resolve()
    running = (async () => {
      try {
        if (!state.booted) await minimalBoot()
      } catch (error) {
        deps.logError('falló el arranque mínimo', error)
        running = null
        publish({ booted: true, status: 'error', error: messageOf(error) })
        return
      }
      await runSeed()
    })()
    return running
  }

  const retry = () => {
    if (state.status !== 'error') return
    void prepare()
  }

  return {
    getState: (): SeedingState => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    prepare,
    retry,
  }
}

export type SeedingStore = ReturnType<typeof createSeedingStore>
