// Store de equipamiento seleccionado (persiste en localStorage).
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Equipment } from '@/domain/types'

export interface EquipmentState {
  selected: Equipment[]
  toggle: (eq: Equipment) => void
  clear: () => void
  selectAll: () => void
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
      selectAll: () => set({ selected: ['barra', 'mancuernas', 'maquina', 'polea', 'peso corporal', 'banco', 'kettlebell', 'banda', 'otro'] }),
    }),
    { name: 'gymlab-equipment' }
  )
)
