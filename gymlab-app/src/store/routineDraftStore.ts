// Borrador de rutina persistido (F134/T2): sobrevive a cambiar de pantalla, a abrir
// la ficha de un ejercicio, al back físico y a una recarga.
// Un único borrador activo; el scope ('new' o 'edit:<slug>') impide que el borrador
// de una rutina se aplique a otra.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createDebouncedPersistStorage } from '@/lib/debouncedPersistStorage'
import type { RoutineDraftDay } from '@/domain/routines'
import type { Level, Objective } from '@/domain/types'

export type RoutineDraftScope = 'new' | `edit:${string}`

export interface PersistedRoutineDraft {
  scope: RoutineDraftScope
  title: string
  objective: Objective
  level: Level
  description: string
  days: RoutineDraftDay[]
  // Id de la rutina cuando el borrador viene del modo edición (null al crear).
  routineId: number | null
  // `false` mientras el borrador es solo la copia cargada de Dexie; `true` en cuanto
  // el usuario toca algo. El aviso de restauración solo mira borradores sucios.
  dirty: boolean
  updatedAt: number
}

interface RoutineDraftState {
  draft: PersistedRoutineDraft | null
  setDraft: (draft: PersistedRoutineDraft) => void
  clearDraft: () => void
}

type PersistedState = Pick<RoutineDraftState, 'draft'>

export const useRoutineDraftStore = create<RoutineDraftState>()(
  persist(
    (set) => ({
      draft: null,
      setDraft: (draft) => set({ draft }),
      clearDraft: () => set({ draft: null }),
    }),
    {
      name: 'gymLab-routineDraft',
      version: 1,
      partialize: (state): PersistedState => ({ draft: state.draft }),
      storage: createDebouncedPersistStorage<PersistedState>({ label: 'routineDraft' }),
    }
  )
)

export const routineDraftScopeFor = (slug?: string): RoutineDraftScope =>
  slug ? `edit:${slug}` : 'new'
