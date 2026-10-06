// Hook que consulta una lista reactiva con referencia estable: mientras la query
// no ha cargado devuelve el mismo array vacío (constante de módulo) para que
// useMemo/useCallback de los consumidores no cambien de dependencias en cada render.
import { useLiveQuery } from 'dexie-react-hooks'

const EMPTY: unknown[] = []

// Variante con estado de carga: expone si Dexie ya resolvió la query. La usa la
// capa única de logros para no evaluar/reconciliar con datos a medio cargar.
export const useLiveListState = <T>(
  query: () => Promise<T[]> | T[],
  deps: unknown[] = []
): [T[], boolean] => {
  const result = useLiveQuery(query, deps)
  return [result ?? (EMPTY as T[]), result !== undefined]
}

export const useLiveList = <T>(query: () => Promise<T[]> | T[], deps: unknown[] = []): T[] =>
  useLiveListState(query, deps)[0]
