// Sugerencia en vivo por bloque (F98.2): el motor F63 se calcula UNA vez a nivel de
// página y se reparte como Map<exerciseId, SessionSuggestion>; cada bloque extrae la
// suya. Para conservar el aislamiento de memo 91.2, la referencia de cada sugerencia
// se reutiliza mientras su contenido no cambie (teclear en un bloque no re-renderiza
// los chips de los bloques hermanos).
import { useMemo, useRef } from 'react'
import {
  generateSuggestions,
  type ActiveSetInput,
  type CompletedSet,
  type SessionSuggestion,
} from '@/domain/sessionSuggestions'
import type { LoadTarget } from '@/domain/loadRecommendation'

// Entrada de caché: firma de contenido + la referencia viva de la sugerencia.
export interface SuggestionCacheEntry {
  key: string
  value: SessionSuggestion
}

// Firma estable del contenido: identifica la sugerencia sin depender de la identidad
// del objeto ni del orden de claves del `data`/`action`. F118: `capped` entra en la
// firma para que el aviso del récord no quede pegado a una referencia vieja.
export const suggestionSignature = (s: SessionSuggestion): string =>
  JSON.stringify([s.id, s.type, s.messageKey, s.data ?? null, s.action ?? null, s.capped ?? null])

// Una sugerencia por ejercicio: el motor ya ordena por prioridad, así que la primera
// aparición de cada exerciseId es la de mayor prioridad.
export const suggestionsByExercise = (
  suggestions: SessionSuggestion[]
): Map<number, SessionSuggestion> => {
  const byExercise = new Map<number, SessionSuggestion>()
  for (const s of suggestions) {
    if (!byExercise.has(s.exerciseId)) byExercise.set(s.exerciseId, s)
  }
  return byExercise
}

// Reutiliza la referencia previa cuando la firma no cambió; devuelve el Map estable y
// la caché nueva (función pura: no muta la caché recibida).
export const stabilizeSuggestions = (
  grouped: Map<number, SessionSuggestion>,
  prev: Map<number, SuggestionCacheEntry>
): { suggestions: Map<number, SessionSuggestion>; cache: Map<number, SuggestionCacheEntry> } => {
  const suggestions = new Map<number, SessionSuggestion>()
  const cache = new Map<number, SuggestionCacheEntry>()
  for (const [exerciseId, s] of grouped) {
    const key = suggestionSignature(s)
    const cached = prev.get(exerciseId)
    const value = cached && cached.key === key ? cached.value : s
    cache.set(exerciseId, { key, value })
    suggestions.set(exerciseId, value)
  }
  return { suggestions, cache }
}

export interface BlockSuggestionInput {
  completedSets: CompletedSet[]
  knownE1RM?: Record<number, number>
  activeSets?: ActiveSetInput[]
  restMinutesByExercise?: Record<number, number>
  loadTargetByExercise?: Record<number, LoadTarget>
  // F118/G3: apagar «Sugerir carga» quita las propuestas de peso (subir y bajar).
  includeLoadSuggestions?: boolean
  // F118/S12: durante el deload no se proponen subidas (las filas ya muestran −10%).
  suppressIncrease?: boolean
}

// F118: filtros de superficie, aplicados ANTES de agrupar para que un ejercicio que
// pierde su propuesta de peso conserve el aviso de otra clase (descanso, rendimiento).
export const filterVisibleSuggestions = (
  suggestions: SessionSuggestion[],
  {
    includeLoadSuggestions = true,
    suppressIncrease = false,
  }: Pick<BlockSuggestionInput, 'includeLoadSuggestions' | 'suppressIncrease'> = {}
): SessionSuggestion[] =>
  suggestions.filter((s) => {
    if (!includeLoadSuggestions && (s.type === 'increase' || s.type === 'decrease')) return false
    if (suppressIncrease && s.type === 'increase') return false
    return true
  })

// Sugerencia viva por ejercicio para los bloques de la sesión activa.
export const useBlockSuggestions = ({
  completedSets,
  knownE1RM,
  activeSets,
  restMinutesByExercise,
  loadTargetByExercise,
  includeLoadSuggestions = true,
  suppressIncrease = false,
}: BlockSuggestionInput): Map<number, SessionSuggestion> => {
  const cacheRef = useRef<Map<number, SuggestionCacheEntry>>(new Map())
  return useMemo(() => {
    const visible = filterVisibleSuggestions(
      generateSuggestions(completedSets, {
        knownE1RM,
        activeSets,
        restMinutesByExercise,
        loadTargetByExercise,
      }),
      { includeLoadSuggestions, suppressIncrease }
    )
    const grouped = suggestionsByExercise(visible)
    const { suggestions, cache } = stabilizeSuggestions(grouped, cacheRef.current)
    cacheRef.current = cache
    return suggestions
  }, [
    completedSets,
    knownE1RM,
    activeSets,
    restMinutesByExercise,
    loadTargetByExercise,
    includeLoadSuggestions,
    suppressIncrease,
  ])
}
