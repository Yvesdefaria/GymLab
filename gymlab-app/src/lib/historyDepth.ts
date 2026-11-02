// Profundidad del historial para decidir si "atrás" puede volver de verdad (F134/T3).
// `location.key` NO sirve: `replace` también acuña una key nueva aunque la entrada
// siga siendo la primera, así que un filtro escrito en la URL convertiría un deep link
// en "hay historial" y el back quedaría en un no-op. React Router mantiene
// `history.state.idx` (0 en la primera entrada, +1 por push, intacto en replace).
// En MemoryRouter (tests) no hay `history.state`, así que se usa `location.key`.
export const canNavigateBack = (historyState: unknown, locationKey: string): boolean => {
  const index = (historyState as { idx?: unknown } | null)?.idx
  if (typeof index === 'number') return index > 0
  return locationKey !== 'default'
}
