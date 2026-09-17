// Store de equipamiento declarado por el usuario («mi gym»), persistido en localStorage.
// Es una preferencia de guía, no un candado del catálogo: con la selección vacía se ve todo.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { EQUIPMENT_OPTIONS } from '@/domain/catalog'
import type { Equipment } from '@/domain/types'

export interface EquipmentState {
  selected: Equipment[]
  toggle: (eq: Equipment) => void
  clear: () => void
  selectAll: () => void
  // Reemplaza la selección completa: la usan los presets del onboarding (MATERIAL_PRESETS).
  setSelected: (equipment: readonly Equipment[]) => void
}

export const useEquipmentStore = create<EquipmentState>()(
  persist(
    (set) => ({
      selected: [],
      toggle: (eq) =>
        set((state) => ({
          selected: state.selected.includes(eq)
            ? state.selected.filter((e) => e !== eq)
            : [...state.selected, eq],
        })),
      clear: () => set({ selected: [] }),
      // Deriva la lista completa del vocabulario canónico para no duplicar los 9 equipos.
      selectAll: () => set({ selected: [...EQUIPMENT_OPTIONS] }),
      // Copia la lista recibida para no compartir la referencia del preset.
      setSelected: (equipment) => set({ selected: [...equipment] }),
    }),
    { name: 'gymlab-equipment' }
  )
)
