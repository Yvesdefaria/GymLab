import { describe, expect, it } from 'vitest'
import type { Exercise } from '@/domain/types'
import type { RoutinePlan } from '@/domain/routineResolution'
import { fitPlanToDuration } from '@/domain/planDuration'

const ex = (id: number, slug: string, muscleGroup: Exercise['muscleGroup'], equipment: Exercise['equipment'] = ['peso corporal']): Exercise => ({
  id, slug, name: slug, muscleGroup, equipment, category: 'strength', instructions: '', imageUrls: [],
} as Exercise)

// catálogo de fixture: 4 de pecho (2 "comunes"), 2 de espalda
const CATALOG: Exercise[] = [
  ex(1, 'press-de-pecho-con-barra', 'pecho', ['barra', 'banco']),
  ex(2, 'press-inclinado-mancuernas', 'pecho', ['mancuernas', 'banco']),
  ex(3, 'aperturas-con-mancuernas', 'pecho', ['mancuernas']),
  ex(4, 'flexiones', 'pecho'),
  ex(5, 'remo-con-barra', 'espalda', ['barra']),
  ex(6, 'jalon-al-pecho', 'espalda'),
]

const day = (items: RoutinePlan['days'][number]['items'], dayNumber = 1) => ({
  dayNumber, name: `Día ${dayNumber}`, items, estimatedMinutes: 0,
})

const plan = (...days: RoutinePlan['days']): RoutinePlan => ({
  source: 'generated', title: 'Plan test', objective: 'volumen', level: 'principiante', daysPerWeek: days.length, days,
  coverage: { omittedGroups: [], droppedDays: [] },
})

describe('fitPlanToDuration', () => {
  it('recorta ítems cuando el día se pasa del objetivo (con tolerancia de 5 min)', () => {
    // 4 series × (45+180) = 900s = 15 + 4 = 19 min por ejercicio; 3 ejercicios = 57 min; objetivo 30
    const heavy = { targetSets: 4, targetReps: 8, restSec: 180 }
    const result = fitPlanToDuration(
      plan(day([{ exerciseId: 1, ...heavy }, { exerciseId: 2, ...heavy }, { exerciseId: 3, ...heavy }])),
      30, CATALOG, [],
    )
    const d = result.days[0]
    expect(d.items.length).toBeLessThan(3)
    expect(d.estimatedMinutes).toBeLessThanOrEqual(35)
  })

  it('nunca quita el único ítem de un grupo (sin grupos huérfanos)', () => {
    const heavy = { targetSets: 5, targetReps: 5, restSec: 240 }
    // un solo ejercicio de espalda: no es removible aunque el día se pase
    const result = fitPlanToDuration(plan(day([{ exerciseId: 5, ...heavy }])), 10, CATALOG, [])
    expect(result.days[0].items.map((i) => i.exerciseId)).toEqual([5])
  })

  it('expande con candidatos del mismo grupo que no están en el día, respetando equipamiento', () => {
    // 1 ejercicio liviano: 3×(45+60)=315s=6min+3=9; objetivo 30 → expande pecho
    const light = { targetSets: 3, targetReps: 12, restSec: 60 }
    const result = fitPlanToDuration(plan(day([{ exerciseId: 4, ...light }])), 30, CATALOG, ['mancuernas'])
    const ids = result.days[0].items.map((i) => i.exerciseId)
    expect(ids).toContain(4)
    expect(ids.length).toBeGreaterThan(1)
    // con ['mancuernas'] no puede entrar la barra
    expect(ids).not.toContain(1)
    // dentro de tolerancia o sin más candidatos
    expect(result.days[0].estimatedMinutes).toBeLessThanOrEqual(30)
  })

  it('prueba el siguiente candidato cuando el primero no entra por la tolerancia superior', () => {
    // Día con un grupo pesado (pecho: 4×8, 180 s de descanso ≈ 19 min) y uno liviano
    // (espalda: 2×10, 30 s ≈ 5 min) = 24 min; objetivo 30 → expande (necesita < 25).
    // El candidato del grupo pesado sumaría 19 min (43 > 35) y no entra; el del liviano
    // suma 5 (28 ≤ 35) y SÍ debe agregarse: el primero no costeable no corta la expansión.
    const catalog: Exercise[] = [
      ex(1, 'press-de-pecho-con-barra', 'pecho'),
      ex(2, 'jalon-al-pecho', 'espalda'),
      ex(3, 'press-de-pecho-con-barra-2', 'pecho'),
      ex(4, 'remo-con-barra-2', 'espalda'),
    ]
    const result = fitPlanToDuration(
      plan(day([
        { exerciseId: 1, targetSets: 4, targetReps: 8, restSec: 180 },
        { exerciseId: 2, targetSets: 2, targetReps: 10, restSec: 30 },
      ])),
      30, catalog, [],
    )
    expect(result.days[0].items.map((i) => i.exerciseId)).toEqual([1, 2, 4])
  })

  it('no toca el día si ya está dentro de ±5 min del objetivo', () => {
    const light = { targetSets: 3, targetReps: 12, restSec: 60 }
    const before = plan(day([{ exerciseId: 1, ...light }, { exerciseId: 5, ...light }]))
    // 6+3=9 min × 2 = 18 min... objetivo 20 → dentro de ±5? 18 ≥ 15 → no expande ni recorta
    const result = fitPlanToDuration(before, 20, CATALOG, [])
    expect(result.days[0].items).toHaveLength(2)
  })

  it('recalcula estimatedMinutes de cada día tras el ajuste', () => {
    const light = { targetSets: 3, targetReps: 12, restSec: 60 }
    const result = fitPlanToDuration(plan(day([{ exerciseId: 4, ...light }])), 30, CATALOG, [])
    expect(result.days[0].estimatedMinutes).toBeGreaterThan(0)
  })
})
