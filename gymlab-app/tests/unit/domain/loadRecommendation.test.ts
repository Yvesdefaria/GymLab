// Tests del motor unificado de recomendación de carga (F97.2/97.3/97.4).
// Cubre: promedio de top set de las últimas N sesiones (sin warmups, peso observado),
// fallback a la última sesión y al PR, techo estricto del PR y redondeo al plato más
// cercano (sin redondear hacia arriba por encima del PR), y el factor RIR conservador.
import { describe, expect, it } from 'vitest'
import {
  RECENT_SESSIONS_N,
  recentTopSetAverage,
  recommendLoad,
} from '@/domain/loadRecommendation'
import type { WorkoutSet } from '@/domain/types'

// Serie de historial con valores por defecto razonables (completada, sin warmup).
const ws = (
  workoutId: number,
  exerciseId: number,
  weightKg: number,
  overrides: Partial<WorkoutSet> = {}
): WorkoutSet => ({
  id: workoutId * 100 + exerciseId,
  workoutId,
  exerciseId,
  setNumber: 1,
  weightKg,
  reps: 8,
  completed: true,
  createdAt: `2026-08-${String(workoutId).padStart(2, '0')}T10:00:00.000Z`,
  ...overrides,
})

describe('recentTopSetAverage — promedio de top set de las últimas N sesiones', () => {
  it('promedia el top set de cinco sesiones (100, 95, 105, 100, 100 → 100)', () => {
    const sets = [
      ws(1, 10, 100),
      ws(2, 10, 95),
      ws(3, 10, 105),
      ws(4, 10, 100),
      ws(5, 10, 100),
    ]
    expect(recentTopSetAverage(sets)).toBe(100)
    expect(RECENT_SESSIONS_N).toBe(5)
  })

  it('excluye los warmups aunque sean el peso más alto', () => {
    // La sesión 1 tiene un warmup de 120 y una serie de trabajo de 100: el top set es 100.
    const sets = [
      ws(1, 10, 120, { isWarmup: true }),
      ws(1, 10, 100),
    ]
    expect(recentTopSetAverage(sets)).toBe(100)
  })

  it('usa el peso observado y no el e1RM (un set pesado de pocas reps gana)', () => {
    // 100 × 1 (e1RM ≈ 100) contra 80 × 10 (e1RM ≈ 106): el top set observado es 100.
    const sets = [
      ws(1, 10, 100, { reps: 1 }),
      ws(1, 10, 80, { reps: 10 }),
    ]
    expect(recentTopSetAverage(sets)).toBe(100)
  })

  it('con menos de N sesiones promedia las disponibles (no devuelve 0)', () => {
    const sets = [ws(1, 10, 90), ws(2, 10, 110)]
    expect(recentTopSetAverage(sets)).toBe(100)
  })

  it('con más de N sesiones solo considera las más recientes (excluye la más vieja)', () => {
    // La sesión más vieja (id 1) vale 60; las cinco recientes valen 100.
    const sets = [
      ws(1, 10, 60),
      ws(2, 10, 100),
      ws(3, 10, 100),
      ws(4, 10, 100),
      ws(5, 10, 100),
      ws(6, 10, 100),
    ]
    expect(recentTopSetAverage(sets)).toBe(100)
  })

  it('ignora series no completadas o sin peso', () => {
    const sets = [
      ws(1, 10, 200, { completed: false }),
      ws(1, 10, 0),
      ws(1, 10, 80),
    ]
    expect(recentTopSetAverage(sets)).toBe(80)
  })

  it('devuelve 0 sin series válidas', () => {
    expect(recentTopSetAverage([])).toBe(0)
    expect(recentTopSetAverage([ws(1, 10, 100, { isWarmup: true })])).toBe(0)
  })
})

describe('recommendLoad — base, techo del PR, redondeo y RIR', () => {
  it('usa el promedio reciente como base y no el PR (el PR ya no es piso)', () => {
    const r = recommendLoad({
      recentTopSetAvgKg: 100,
      lastSessionTopSetKg: 95,
      prWeightKg: 120,
      progressionPct: 2.5,
    })
    expect(r.baseKg).toBe(100)
    expect(r.weightKg).toBe(102.5)
    expect(r.capped).toBe(false)
  })

  it('cae a la última sesión cuando no hay promedio reciente', () => {
    const r = recommendLoad({
      recentTopSetAvgKg: 0,
      lastSessionTopSetKg: 100,
      prWeightKg: 120,
      progressionPct: 2.5,
    })
    expect(r.baseKg).toBe(100)
    expect(r.weightKg).toBe(102.5)
  })

  it('cae al PR cuando no hay historial ni última sesión', () => {
    const r = recommendLoad({
      recentTopSetAvgKg: 0,
      lastSessionTopSetKg: 0,
      prWeightKg: 80,
      progressionPct: 2.5,
    })
    expect(r.baseKg).toBe(80)
    expect(r.weightKg).toBe(80)
    expect(r.capped).toBe(true)
  })

  it('devuelve 0 solo cuando no hay ninguna fuente', () => {
    expect(
      recommendLoad({ recentTopSetAvgKg: 0, lastSessionTopSetKg: 0, prWeightKg: 0, progressionPct: 2.5 })
    ).toEqual({ weightKg: 0, baseKg: 0, capped: false })
  })

  it('aplica el PR como techo estricto aunque el redondeo apunte más alto', () => {
    // base 120 + 5% = 126 → plato más cercano 125; pero el PR 120 manda.
    const r = recommendLoad({
      recentTopSetAvgKg: 120,
      lastSessionTopSetKg: 120,
      prWeightKg: 120,
      progressionPct: 5,
    })
    expect(r.weightKg).toBe(120)
    expect(r.capped).toBe(true)
  })

  it('redondea al plato más cercano sin redondear hacia arriba (no ceil)', () => {
    // 101 × 1.025 = 103.525 → plato más cercano 102.5 (ceil daría 105).
    const r = recommendLoad({
      recentTopSetAvgKg: 101,
      lastSessionTopSetKg: 101,
      prWeightKg: 200,
      progressionPct: 2.5,
    })
    expect(r.weightKg).toBe(102.5)
  })

  it('respeta un plato distinto a 2.5', () => {
    const r = recommendLoad({
      recentTopSetAvgKg: 100,
      lastSessionTopSetKg: 100,
      prWeightKg: 200,
      progressionPct: 2,
      plateKg: 5,
    })
    // 102 → múltiplo de 5 más cercano: 100 (no 105).
    expect(r.weightKg).toBe(100)
  })

  it('con RIR alto (lejos del fallo) el paso nunca supera la progresión configurada', () => {
    const r = recommendLoad({
      recentTopSetAvgKg: 100,
      lastSessionTopSetKg: 100,
      prWeightKg: 200,
      rir: 3,
      progressionPct: 5,
    })
    expect(r.weightKg).toBe(105) // exactamente 5%, sin amplificar
  })

  it('con RIR bajo (cerca del fallo) el paso se des-amplifica (×0.5)', () => {
    const nearFailure = recommendLoad({
      recentTopSetAvgKg: 100,
      lastSessionTopSetKg: 100,
      prWeightKg: 200,
      rir: 1,
      progressionPct: 5,
    })
    const farFromFailure = recommendLoad({
      recentTopSetAvgKg: 100,
      lastSessionTopSetKg: 100,
      prWeightKg: 200,
      rir: 3,
      progressionPct: 5,
    })
    expect(nearFailure.weightKg).toBe(102.5)
    expect(nearFailure.weightKg).toBeLessThan(farFromFailure.weightKg)
  })
})
