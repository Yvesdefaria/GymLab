// Hook que consulta una lista reactiva con referencia estable: mientras la query
// no ha cargado devuelve el mismo array vacío (constante de módulo) para que
// useMemo/useCallback de los consumidores no cambien de dependencias en cada render.
import { useLiveQuery } from 'dexie-react-hooks'

const EMPTY: unknown[] = []

export const useLiveList = <T>(query: () => Promise<T[]> | T[], deps: unknown[] = []): T[] => {
  const result = useLiveQuery(query, deps)
  return result ?? (EMPTY as T[])
}
