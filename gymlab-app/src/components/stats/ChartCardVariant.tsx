// Contexto que permite a /estadisticas renderizar todos sus ChartCard en modo
// minimal (sin tarjeta) sin tocar los charts de otras páginas.
import { createContext, useContext, type ReactNode } from 'react'

export type ChartCardVariant = 'panel' | 'minimal'

const ChartCardVariantContext = createContext<ChartCardVariant>('panel')

export const ChartCardVariantProvider = ({
  variant,
  children,
}: {
  variant: ChartCardVariant
  children: ReactNode
}) => (
  <ChartCardVariantContext.Provider value={variant}>
    {children}
  </ChartCardVariantContext.Provider>
)

export const useChartCardVariant = (): ChartCardVariant =>
  useContext(ChartCardVariantContext)
