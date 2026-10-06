// F103/T3: proveedor del seed no bloqueante. Mientras corre el arranque mínimo
// (Ajustes + idioma) no se pinta nada; apenas termina se monta la shell y el
// seed sigue en segundo plano. La UI lo lee con `useSeedingStatus()`.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { metaRepo, profileRepo } from '@/data/repositories'
import { SEED_VERSION } from '@/data/repositories/dexie/db'
import { SETTINGS_META_KEY, type AppSettings } from '@/domain/settings'
import { applyLanguage } from '@/i18n'
import { logger } from '@/lib/logger'
import { createSeedingStore, type SeedingDeps, type SeedingState } from './seedingStore'

// Deps reales: el fast path no importa el chunk del reseeder (mismo criterio
// que el providers bloqueante anterior).
const defaultDeps: SeedingDeps = {
  loadSettings: () => metaRepo.getJson<Partial<AppSettings>>(SETTINGS_META_KEY, {}),
  applyLanguage: (lang) => applyLanguage(lang),
  isSeedCurrent: async () => (await metaRepo.get('seedVersion'))?.value === SEED_VERSION,
  ensureProfile: async () => {
    await profileRepo.ensure()
  },
  runReseed: async () => {
    const { ensureSeeded } = await import('@/data/seed/reseeder')
    await ensureSeeded()
  },
  logError: (message, error) => logger.error('boot', message, { error }),
}

type SeedingContextValue = Pick<SeedingState, 'status' | 'error'> & { retry: () => void }

const SeedingContext = createContext<SeedingContextValue | null>(null)

export const SeedingProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(() => createSeedingStore(defaultDeps))
  const [state, setState] = useState<SeedingState>(() => store.getState())

  useEffect(() => {
    const unsubscribe = store.subscribe(() => setState(store.getState()))
    void store.prepare()
    return unsubscribe
  }, [store])

  // Arranque mínimo en curso: evita pintar la shell con el idioma equivocado.
  if (!state.booted) return null

  return (
    <SeedingContext.Provider value={{ status: state.status, error: state.error, retry: store.retry }}>
      {children}
    </SeedingContext.Provider>
  )
}

export const useSeedingStatus = (): SeedingContextValue => {
  const value = useContext(SeedingContext)
  if (!value) throw new Error('useSeedingStatus requiere <SeedingProvider>')
  return value
}
