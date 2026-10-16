// F122: dominio de progresión por peso de trabajo — base, evidencia (doble progresión) y escalón.
import { describe, expect, it } from 'vitest'
import {
  workingBase,
  hasMargin,
  decideStep,
  buildEscalada,
  type WorkingSetLike,
} from '@/domain/workingProgression'

const set = (
  workoutId: number,
  weightKg: number,
  reps: number,
  extra: Partial<WorkingSetLike> = {}
): WorkingSetLike => ({
  workoutId,
  weightKg,
  reps,
  completed: true,
  createdAt: `2026-09-${String(10 + workoutId).padStart(2, '0')}T10:00:00.000Z`,
  ...extra,
})

// Sesión típica: 3 series de trabajo al mismo peso/reps.
const session = (workoutId: number, weightKg: number, reps: number): WorkingSetLike[] =>
  Array.from({ length: 3 }, () => set(workoutId, weightKg, reps))

describe('workingBase', () => {
  it('promedia los tops de trabajo de las últimas 5 sesiones (ignora la más vieja)', () => {
    const sets = [
      ...session(1, 70, 8),
      ...session(2, 75, 8),
      ...session(3, 80, 8),
      ...session(4, 80, 8),
      ...session(5, 80, 8),
      ...session(6, 85, 8),
    ]
    expect(workingBase(sets)).toBe(80)
  })

  it('ignora calentamientos y series de ≤3 reps', () => {
    const sets = [
      set(1, 60, 8, { isWarmup: true }),
      set(1, 80, 8),
      set(1, 100, 2),
      set(2, 80, 8),
      set(2, 100, 2),
    ]
    expect(workingBase(sets)).toBe(80)
  })

  it('sin series de trabajo válidas devuelve 0', () => {
    expect(workingBase([])).toBe(0)
    expect(workingBase([set(1, 60, 8, { isWarmup: true })])).toBe(0)
  })
})

describe('hasMargin', () => {
  it('con +2 reps sostenidas en las últimas 2 sesiones al mismo peso → true', () => {
    const sets = [...session(1, 80, 10), ...session(2, 80, 13), ...session(3, 80, 15)]
    expect(hasMargin(sets)).toBe(true)
  })

  it('con mejora menor a +2 → false', () => {
    const sets = [...session(1, 80, 10), ...session(2, 80, 11), ...session(3, 80, 11)]
    expect(hasMargin(sets)).toBe(false)
  })

  it('exige mejora sostenida: con solo 2 sesiones en el peso → false', () => {
    const sets = [...session(1, 80, 10), ...session(2, 80, 20)]
    expect(hasMargin(sets)).toBe(false)
  })

  it('sin peso repetido cae a e1RM al alza (≥2%)', () => {
    const sets = [...session(1, 70, 10), ...session(2, 90, 10)]
    expect(hasMargin(sets)).toBe(true)
  })

  it('sin alza de e1RM (sesión reciente más liviana) → false', () => {
    const sets = [...session(1, 90, 10), ...session(2, 70, 10)]
    expect(hasMargin(sets)).toBe(false)
  })
})

describe('decideStep', () => {
  const base80 = [...session(1, 80, 8), ...session(2, 80, 8)]

  it('conocido dentro del 15% gana', () => {
    const sets = [...base80, ...session(3, 90, 8)]
    expect(decideStep({ sets })).toEqual({ targetKg: 90, kind: 'known', capped: false })
  })

  it('sin conocido → micro +2,5% redondeado a placa', () => {
    expect(decideStep({ sets: base80 })).toEqual({ targetKg: 82.5, kind: 'micro', capped: false })
  })

  it('un conocido lejano (>15%) no se usa', () => {
    // La sesión pesada mueve la base (90 = promedio de 110/80/80); 110 queda >15% → micro.
    const sets = [...base80, ...session(3, 110, 8)]
    expect(decideStep({ sets })).toEqual({ targetKg: 92.5, kind: 'micro', capped: false })
  })

  it('un set suelto a un peso mayor no es territorio conocido', () => {
    // Base corrida a 83,33 por el set suelto; conocido exige ≥2 series → micro 85.
    const sets = [...base80, set(3, 90, 8)]
    expect(decideStep({ sets })).toEqual({ targetKg: 85, kind: 'micro', capped: false })
  })

  it('el PR recorta el objetivo y marca capped', () => {
    expect(decideStep({ sets: base80, prWeightKg: 82 })).toEqual({
      targetKg: 82,
      kind: 'micro',
      capped: true,
    })
  })

  it('un PR por encima del objetivo no recorta', () => {
    expect(decideStep({ sets: base80, prWeightKg: 100 })).toEqual({
      targetKg: 82.5,
      kind: 'micro',
      capped: false,
    })
  })

  it('sin historial → null', () => {
    expect(decideStep({ sets: [] })).toBeNull()
  })
})

describe('buildEscalada', () => {
  it('distribuye uniforme y redondea a placa (3 series)', () => {
    expect(buildEscalada(80, 90, 3)).toEqual([80, 85, 90])
  })

  it('distribuye uniforme y redondea a placa (4 series)', () => {
    expect(buildEscalada(80, 90, 4)).toEqual([80, 82.5, 87.5, 90])
  })

  it('con paso micro mantiene valores válidos repetidos', () => {
    expect(buildEscalada(80, 82.5, 4)).toEqual([80, 80, 82.5, 82.5])
  })

  it('una sola serie = el objetivo', () => {
    expect(buildEscalada(80, 90, 1)).toEqual([90])
  })

  it('dos series = base y objetivo', () => {
    expect(buildEscalada(80, 90, 2)).toEqual([80, 90])
  })
})
