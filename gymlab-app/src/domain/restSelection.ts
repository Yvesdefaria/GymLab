// Selección de descanso: modo pegajoso Auto frente a una duración explícita (F96, D2).
// Lógica pura y sin dependencias: la resolven tanto el store como los tests.
export type RestMode = 'auto' | number

export interface RestSelection {
  restMode: RestMode
  routineRestSec: number | null
  autoRestSeconds: number
}

// Un preset explícito gana siempre; sin él, manda el restSec de la rutina y,
// como último recurso, la recomendación heurística (modo Auto).
export const resolveRestSeconds = ({
  restMode,
  routineRestSec,
  autoRestSeconds,
}: RestSelection): number => {
  if (typeof restMode === 'number') return restMode
  if (routineRestSec !== null) return routineRestSec
  return autoRestSeconds
}

export const isAutoRestMode = (mode: RestMode): boolean => mode === 'auto'
