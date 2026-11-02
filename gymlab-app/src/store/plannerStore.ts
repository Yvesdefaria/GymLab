// Configuración del planificador persistida (F134/T2): recuerda nivel, objetivo,
// días por semana y duración de sesión entre visitas.
// El plan generado NO se persiste: se regenera al volver. `configured` distingue
// "nunca tocado" de "elegido por el usuario", para que el prefill del onboarding
// no pise una preferencia ya configurada.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createDebouncedPersistStorage } from '@/lib/debouncedPersistStorage'
import { DEFAULT_SESSION_DURATION_MIN } from '@/domain/routineResolution'
import type { Level, Objective } from '@/domain/types'

export interface PlannerConfig {
  level: Level
  objective: Objective
  daysPerWeek: number
  sessionDurationMin: number
}

interface PlannerState extends PlannerConfig {
  // `true` en cuanto el usuario cambia una opción a mano.
  configured: boolean
  setConfig: (patch: Partial<PlannerConfig>) => void
  // Aplica los defaults del onboarding sin marcarlos como elección del usuario.
  applyPrefill: (patch: Partial<PlannerConfig>) => void
  reset: () => void
}

const DEFAULT_CONFIG: PlannerConfig = {
  level: 'principiante',
  objective: 'volumen',
  daysPerWeek: 4,
  sessionDurationMin: DEFAULT_SESSION_DURATION_MIN,
}

type PersistedState = PlannerConfig & Pick<PlannerState, 'configured'>

// Nombre de la clave de storage: `factoryReset` la importa para no duplicar literales.
export const PLANNER_STORAGE_KEY = 'gymLab-plannerConfig'

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      ...DEFAULT_CONFIG,
      configured: false,
      setConfig: (patch) => set({ ...patch, configured: true }),
      applyPrefill: (patch) => set(patch),
      reset: () => set({ ...DEFAULT_CONFIG, configured: false }),
    }),
    {
      name: PLANNER_STORAGE_KEY,
      version: 1,
      partialize: (state): PersistedState => ({
        level: state.level,
        objective: state.objective,
        daysPerWeek: state.daysPerWeek,
        sessionDurationMin: state.sessionDurationMin,
        configured: state.configured,
      }),
      storage: createDebouncedPersistStorage<PersistedState>({ label: 'planner' }),
    }
  )
)
