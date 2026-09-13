// Test de caracterización (golden) de la recomendación de descanso (F96 · Fase 5, tarea 5.1).
// Congela las salidas ACTUALES de `calcRestRecommendation` para que Fase 97.1 pueda
// refactorizar el algoritmo y unificar sus fuentes de datos sin cambiar el comportamiento
// observable. No modifica el dominio ni sus datos: sólo importa y asserta entradas → salidas.
import { describe, expect, it } from 'vitest'
import { calcRestRecommendation } from '@/domain/restRecommendation'
import type {
  ExerciseCategory,
  RestRecommendation,
  TrainingGoal,
} from '@/domain/restRecommendation'

type BaseCase = {
  category: ExerciseCategory
  goal: TrainingGoal
  expected: RestRecommendation
}

// Matriz sin intensidad: cada combinación categoría × objetivo con su rango rounded y su reason.
const BASE_CASES: BaseCase[] = [
  {
    category: 'compuesto',
    goal: 'fuerza',
    expected: { minSeconds: 180, maxSeconds: 300, recommendedSeconds: 240, reason: 'rest.reason_compound_fuerza' },
  },
  {
    category: 'compuesto',
    goal: 'hipertrofia',
    expected: { minSeconds: 90, maxSeconds: 180, recommendedSeconds: 135, reason: 'rest.reason_compound_hipertrofia' },
  },
  {
    category: 'compuesto',
    goal: 'resistencia',
    expected: { minSeconds: 30, maxSeconds: 60, recommendedSeconds: 45, reason: 'rest.reason_general' },
  },
  {
    category: 'aislamiento',
    goal: 'fuerza',
    expected: { minSeconds: 120, maxSeconds: 180, recommendedSeconds: 150, reason: 'rest.reason_isolation' },
  },
  {
    category: 'aislamiento',
    goal: 'hipertrofia',
    expected: { minSeconds: 60, maxSeconds: 90, recommendedSeconds: 75, reason: 'rest.reason_isolation' },
  },
  {
    category: 'aislamiento',
    goal: 'resistencia',
    expected: { minSeconds: 30, maxSeconds: 60, recommendedSeconds: 45, reason: 'rest.reason_isolation' },
  },
]

describe('calcRestRecommendation — caracterización (F97.1)', () => {
  it('matriz base sin intensidad: rangos, recomendado y reason quedan congelados', () => {
    for (const { category, goal, expected } of BASE_CASES) {
      expect(calcRestRecommendation(category, goal)).toEqual(expected)
    }
  })

  it('RPE alto (>= 9) escala el rango ×1.3', () => {
    expect(calcRestRecommendation('compuesto', 'fuerza', 9)).toEqual({
      minSeconds: 234,
      maxSeconds: 390,
      recommendedSeconds: 312,
      reason: 'rest.reason_compound_fuerza',
    })
  })

  it('RPE medio (7-8) escala el rango ×1.1', () => {
    expect(calcRestRecommendation('compuesto', 'fuerza', 7)).toEqual({
      minSeconds: 198,
      maxSeconds: 330,
      recommendedSeconds: 264,
      reason: 'rest.reason_compound_fuerza',
    })
  })

  it('RPE bajo (<= 5) escala el rango ×0.8', () => {
    expect(calcRestRecommendation('compuesto', 'fuerza', 5)).toEqual({
      minSeconds: 144,
      maxSeconds: 240,
      recommendedSeconds: 192,
      reason: 'rest.reason_compound_fuerza',
    })
  })

  it('RPE 6 queda neutro (×1) y no altera el rango base', () => {
    expect(calcRestRecommendation('compuesto', 'fuerza', 6)).toEqual({
      minSeconds: 180,
      maxSeconds: 300,
      recommendedSeconds: 240,
      reason: 'rest.reason_compound_fuerza',
    })
  })

  it('RIR bajo (<= 1) impone al menos ×1.2 aunque el RPE sea neutro', () => {
    expect(calcRestRecommendation('compuesto', 'fuerza', undefined, 1)).toEqual({
      minSeconds: 216,
      maxSeconds: 360,
      recommendedSeconds: 288,
      reason: 'rest.reason_compound_fuerza',
    })
  })

  it('RIR bajo no rebaja el factor de un RPE alto (gana el mayor)', () => {
    expect(calcRestRecommendation('compuesto', 'fuerza', 9, 1)).toEqual({
      minSeconds: 234,
      maxSeconds: 390,
      recommendedSeconds: 312,
      reason: 'rest.reason_compound_fuerza',
    })
  })

  it('RIR > 1 no ajusta nada', () => {
    expect(calcRestRecommendation('compuesto', 'fuerza', 9, 2)).toEqual({
      minSeconds: 234,
      maxSeconds: 390,
      recommendedSeconds: 312,
      reason: 'rest.reason_compound_fuerza',
    })
  })

  it('el recomendado redondea el punto medio hacia arriba (ej. 175.5 → 176)', () => {
    // Base aislamiento/hipertrofia [60, 90] × 1.3 → [78, 117]; punto medio 97.5.
    expect(calcRestRecommendation('aislamiento', 'hipertrofia', 9)).toEqual({
      minSeconds: 78,
      maxSeconds: 117,
      recommendedSeconds: 98,
      reason: 'rest.reason_isolation',
    })
    // Base compuesto/hipertrofia [90, 180] × 1.3 → [117, 234]; punto medio 175.5.
    expect(calcRestRecommendation('compuesto', 'hipertrofia', 9)).toEqual({
      minSeconds: 117,
      maxSeconds: 234,
      recommendedSeconds: 176,
      reason: 'rest.reason_compound_hipertrofia',
    })
  })

  it('reason distingue compuesto/fuerza, compuesto/hipertrofia, aislamiento y el caso general', () => {
    expect(calcRestRecommendation('compuesto', 'fuerza').reason).toBe('rest.reason_compound_fuerza')
    expect(calcRestRecommendation('compuesto', 'hipertrofia').reason).toBe('rest.reason_compound_hipertrofia')
    expect(calcRestRecommendation('aislamiento', 'resistencia').reason).toBe('rest.reason_isolation')
    expect(calcRestRecommendation('compuesto', 'resistencia').reason).toBe('rest.reason_general')
  })
})
