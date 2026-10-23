// Alturas de charts por contexto. Stats C1 las baja (110 area/bar, 160 donut)
// sin tocar las demás páginas, que siguen usando la altura que pasa cada chart.
import { createContext, useContext, type ReactNode } from 'react'

export type ChartHeightKind = 'area' | 'bar' | 'donut'
export type ChartHeights = Record<ChartHeightKind, number>

const ChartHeightContext = createContext<ChartHeights | null>(null)

export const ChartHeightProvider = ({
  value,
  children,
}: {
  value: ChartHeights
  children: ReactNode
}) => (
  <ChartHeightContext.Provider value={value}>
    {children}
  </ChartHeightContext.Provider>
)

export const useChartHeight = (kind: ChartHeightKind): number | null => {
  const heights = useContext(ChartHeightContext)
  return heights ? heights[kind] : null
}
