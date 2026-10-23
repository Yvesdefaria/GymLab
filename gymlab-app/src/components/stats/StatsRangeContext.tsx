// Rango compartido de Stats C1: el mockup muestra 30 d / 90 d / Todo arriba.
// Las páginas que no proveen contexto (p. ej. Perfil) conservan su rango local.
import { createContext, useContext, useState, type ReactNode } from 'react'
import type { StatsRange } from '@/domain/dates'

type StatsRangeValue = {
  range: StatsRange
  setRange: (range: StatsRange) => void
}

const StatsRangeContext = createContext<StatsRangeValue | null>(null)

export const StatsRangeProvider = ({
  range,
  setRange,
  children,
}: StatsRangeValue & { children: ReactNode }) => (
  <StatsRangeContext.Provider value={{ range, setRange }}>
    {children}
  </StatsRangeContext.Provider>
)

/** Contexto compartido o rango local (fallback fuera de /estadisticas). */
export const useStatsRange = (): StatsRangeValue & { global: boolean } => {
  const ctx = useContext(StatsRangeContext)
  const [localRange, setLocalRange] = useState<StatsRange>(30)
  return ctx
    ? { ...ctx, global: true }
    : { range: localRange, setRange: setLocalRange, global: false }
}
