// F101: estado efímero del tour guiado (auto tras el setup o repetido desde Ajustes).
// La persistencia (meta) la escriben los componentes que usan el store, no el store.
import { create } from 'zustand'

export type TourSource = 'auto' | 'replay'

export interface TourState {
  source: TourSource | null
  start: (source: TourSource) => void
  close: () => void
}

export const useTourStore = create<TourState>()((set) => ({
  source: null,
  start: (source) => set({ source }),
  close: () => set({ source: null }),
}))
