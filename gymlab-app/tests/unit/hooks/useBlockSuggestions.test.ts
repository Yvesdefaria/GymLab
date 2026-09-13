// Tests del mapeo motor→bloque (F98.2): una sugerencia por ejercicio y reutilización
// de la referencia para conservar el aislamiento de memo 91.2 (teclear en un bloque no
// debe re-renderizar los chips de los bloques hermanos).
// Convención del repo: se testea la lógica pura exportada del hook; el glue React se
// cubre con el build y la regresión e2e.
import { describe, expect, it } from 'vitest'
import {
  suggestionsByExercise,
  stabilizeSuggestions,
  suggestionSignature,
  type SuggestionCacheEntry,
} from '@/hooks/useBlockSuggestions'
import type { SessionSuggestion } from '@/domain/sessionSuggestions'

const suggestion = (overrides: Partial<SessionSuggestion> = {}): SessionSuggestion => ({
  id: 'increase-1',
  type: 'increase',
  exerciseId: 1,
  messageKey: 'suggestions.increaseWeight',
  priority: 'high',
  data: { amount: 2.5 },
  action: { kind: 'applyWeight', amountKg: 2.5 },
  ...overrides,
})

describe('suggestionsByExercise', () => {
  it('conserva la primera sugerencia (mayor prioridad) de cada ejercicio', () => {
    const grouped = suggestionsByExercise([
      suggestion({ id: 'increase-1', exerciseId: 1 }),
      suggestion({ id: 'rest-1', exerciseId: 1, type: 'rest' }),
      suggestion({ id: 'increase-2', exerciseId: 2 }),
    ])
    expect(grouped.size).toBe(2)
    expect(grouped.get(1)?.id).toBe('increase-1')
    expect(grouped.get(2)?.id).toBe('increase-2')
  })

  it('sin sugerencias devuelve un Map vacío', () => {
    expect(suggestionsByExercise([]).size).toBe(0)
  })
})

describe('stabilizeSuggestions — aislamiento de memo (91.2)', () => {
  it('reutiliza la referencia previa cuando la firma no cambió', () => {
    const previous = suggestion()
    const cache: Map<number, SuggestionCacheEntry> = new Map([
      [1, { key: suggestionSignature(previous), value: previous }],
    ])
    const { suggestions } = stabilizeSuggestions(
      new Map([[1, suggestion()]]),
      cache
    )
    expect(suggestions.get(1)).toBe(previous)
  })

  it('crea una referencia nueva cuando la firma cambió', () => {
    const previous = suggestion({ data: { amount: 2.5 }, action: { kind: 'applyWeight', amountKg: 2.5 } })
    const cache: Map<number, SuggestionCacheEntry> = new Map([
      [1, { key: suggestionSignature(previous), value: previous }],
    ])
    const changed = suggestion({ data: { amount: 5 }, action: { kind: 'applyWeight', amountKg: 5 } })
    const { suggestions } = stabilizeSuggestions(new Map([[1, changed]]), cache)
    expect(suggestions.get(1)).toBe(changed)
    expect(suggestions.get(1)).not.toBe(previous)
  })

  it('sin caché previa usa la sugerencia del motor y no mezcla ejercicios', () => {
    const a = suggestion({ exerciseId: 3, id: 'increase-3' })
    const { suggestions, cache } = stabilizeSuggestions(new Map([[3, a]]), new Map())
    expect(suggestions.get(3)).toBe(a)
    expect(cache.get(3)?.value).toBe(a)
  })
})
