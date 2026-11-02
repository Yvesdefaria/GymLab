// Estado de pantalla en la URL (F134/T3).
// Búsqueda, filtros, pestaña o día sobreviven a entrar a un detalle y volver, a una
// recarga y a un deep link, sin código de persistencia propio. La escritura usa
// `replace` para no crear una entrada de historial por carácter tecleado, y todo
// valor inválido cae al default en vez de romper la pantalla.
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

export type UrlSpec<T> = {
  // Nombre del parámetro en la query.
  key: string
  // Valor cuando el parámetro falta o es inválido.
  fallback: T
  parse: (raw: string | null) => T
  // `null` omite el parámetro (así la URL limpia no arrastra defaults).
  format: (value: T) => string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- el schema es heterogéneo por diseño.
export type UrlSchema = Record<string, UrlSpec<any>>

export type UrlStateOf<S extends UrlSchema> = {
  [K in keyof S]: S[K] extends UrlSpec<infer T> ? T : never
}

// Texto libre (búsqueda). Vacío = parámetro ausente.
export const urlText = (key: string, fallback = ''): UrlSpec<string> => ({
  key,
  fallback,
  parse: (raw) => raw ?? fallback,
  format: (value) => (value.trim() === '' ? null : value),
})

// Uno de un conjunto cerrado; cualquier otro valor cae al fallback.
export const urlEnum = <T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T | null
): UrlSpec<T | null> => ({
  key,
  fallback,
  parse: (raw) =>
    raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback,
  format: (value) => value,
})

export const urlNumber = (key: string, fallback: number): UrlSpec<number> => ({
  key,
  fallback,
  parse: (raw) => {
    if (raw === null || raw.trim() === '') return fallback
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : fallback
  },
  format: (value) => String(value),
})

// Número de un conjunto cerrado (p. ej. los rangos 30/90/0 de estadísticas).
export const urlNumberFrom = <T extends number>(
  key: string,
  allowed: readonly T[],
  fallback: T
): UrlSpec<T> => ({
  key,
  fallback,
  parse: (raw) => {
    if (raw === null || raw.trim() === '') return fallback
    const parsed = Number(raw)
    return (allowed as readonly number[]).includes(parsed) ? (parsed as T) : fallback
  },
  format: (value) => (value === fallback ? null : String(value)),
})

export const urlFlag = (key: string, fallback = false): UrlSpec<boolean> => ({
  key,
  fallback,
  parse: (raw) => (raw === null ? fallback : raw === '1' || raw === 'true'),
  format: (value) => (value ? '1' : null),
})

// Valor que debe cumplir un patrón (p. ej. `YYYY-MM`).
export const urlPattern = (
  key: string,
  pattern: RegExp,
  fallback: string
): UrlSpec<string> => ({
  key,
  fallback,
  parse: (raw) => (raw !== null && pattern.test(raw) ? raw : fallback),
  format: (value) => (value === fallback || !pattern.test(value) ? null : value),
})

export const useUrlState = <S extends UrlSchema>(
  schema: S
): [UrlStateOf<S>, (patch: Partial<UrlStateOf<S>>) => void] => {
  const [params, setParams] = useSearchParams()

  const state = useMemo(() => {
    const next = {} as UrlStateOf<S>
    for (const key of Object.keys(schema) as Array<keyof S>) {
      next[key] = schema[key].parse(params.get(schema[key].key))
    }
    return next
  }, [schema, params])

  // `setSearchParams` aplica el updater contra los params del render: dos llamadas en
  // el mismo gesto se pisarían. La ref guarda lo ya encolado para que la segunda
  // parta de ahí; se limpia cuando la navegación aterriza (params nuevos).
  const pendingRef = useRef<URLSearchParams | null>(null)
  useEffect(() => {
    pendingRef.current = null
  }, [params])

  const update = useCallback(
    (patch: Partial<UrlStateOf<S>>) => {
      const next = new URLSearchParams(pendingRef.current ?? params)
      for (const key of Object.keys(patch) as Array<keyof S>) {
        const spec = schema[key]
        const token = spec.format(patch[key])
        if (token === null || token === '') next.delete(spec.key)
        else next.set(spec.key, token)
      }
      pendingRef.current = next
      // `replace`: el historial guarda pantallas, no cada tecla.
      setParams(next, { replace: true })
    },
    [schema, params, setParams]
  )

  return [state, update]
}
