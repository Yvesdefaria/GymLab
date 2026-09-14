// Tests de las etiquetas del catálogo de rutinas y del slugify.
import { describe, expect, it } from 'vitest'
import { resolveDayStart, selectableDays, slugify } from '@/domain/routines'
import type { RoutineDay, RoutineItem } from '@/domain/types'
import {
  LEVEL_LABELS_ES,
  LEVELS,
  MUSCLE_GROUP_LABELS_ES,
  MUSCLE_GROUPS,
  OBJECTIVE_LABELS_ES,
  OBJECTIVES,
} from '@/domain/catalog'

describe('OBJECTIVE_LABELS_ES', () => {
  it('mapea los 5 objetivos', () => {
    expect(OBJECTIVES).toHaveLength(5)
    expect(OBJECTIVE_LABELS_ES.volumen).toBe('Volumen')
    expect(OBJECTIVE_LABELS_ES.definicion).toBe('Definición')
    expect(OBJECTIVE_LABELS_ES.fuerza).toBe('Fuerza')
    expect(OBJECTIVE_LABELS_ES.resistencia).toBe('Resistencia')
    expect(OBJECTIVE_LABELS_ES.general).toBe('General')
  })
})

describe('LEVEL_LABELS_ES', () => {
  it('mapea los 3 niveles', () => {
    expect(LEVELS).toHaveLength(3)
    expect(LEVEL_LABELS_ES.principiante).toBe('Principiante')
    expect(LEVEL_LABELS_ES.intermedio).toBe('Intermedio')
    expect(LEVEL_LABELS_ES.avanzado).toBe('Avanzado')
  })
})

describe('MUSCLE_GROUP_LABELS_ES', () => {
  it('etiqueta todos los grupos musculares del catálogo', () => {
    expect(MUSCLE_GROUPS).toHaveLength(10)
    expect(MUSCLE_GROUP_LABELS_ES.pecho).toBe('Pecho')
    expect(MUSCLE_GROUP_LABELS_ES.biceps).toBe('Bíceps')
    expect(MUSCLE_GROUP_LABELS_ES.abdomen).toBe('Abdomen')
  })
})

describe('slugify', () => {
  it('normaliza, quita acentos y espacia con guiones', () => {
    expect(slugify('Press Banca')).toBe('press-banca')
    expect(slugify('Fuerza Volumen 3 días')).toBe('fuerza-volumen-3-dias')
    expect(slugify('Espalda  Casa')).toBe('espalda-casa')
  })

  it('recorta guiones iniciales y finales', () => {
    expect(slugify('  Rutina  ')).toBe('rutina')
  })

  it('limita a 60 caracteres', () => {
    const long = 'a'.repeat(80)
    expect(slugify(long)).toHaveLength(60)
  })
})

// Tests de los días seleccionables del selector de día del home (F99.1 D2/D4).
describe('selectableDays', () => {
  const days: RoutineDay[] = [
    { id: 1, routineId: 10, dayIndex: 0, name: 'Día A' },
    { id: 2, routineId: 10, dayIndex: 1, name: 'Día B' },
    { id: 3, routineId: 10, dayIndex: 2, name: 'Día C' },
    { id: 4, routineId: 10, dayIndex: 3, name: 'Día D' },
  ]

  // Construye un itemsByDay donde cada día tiene `count` items.
  const itemsByDay = (counts: Array<[number, number]>) =>
    new Map<number, RoutineItem[]>(
      counts.map(([dayId, count]) => [
        dayId,
        Array.from({ length: count }, (_, i) => ({
          id: dayId * 100 + i,
          routineDayId: dayId,
          exerciseId: 50 + i,
          targetSets: 3,
          targetReps: 10,
          restSec: 90,
          order: i + 1,
        })),
      ]),
    )

  it('excluye los días sin ejercicios', () => {
    const map = itemsByDay([
      [1, 5],
      [3, 4],
    ])
    expect(selectableDays(days, map).map((d) => d.id)).toEqual([1, 3])
  })

  it('filtro parcial: ignora días ausentes del mapa y días con 0 items', () => {
    const map = itemsByDay([
      [2, 0],
      [4, 3],
    ])
    expect(selectableDays(days, map).map((d) => d.id)).toEqual([4])
  })

  it('todo vacío: devuelve lista vacía', () => {
    expect(selectableDays(days, new Map())).toEqual([])
    expect(
      selectableDays(days, itemsByDay([[1, 0]])),
    ).toEqual([])
  })

  it('preserva el orden del plan de la rutina', () => {
    const map = itemsByDay([
      [4, 2],
      [2, 3],
    ])
    expect(selectableDays(days, map).map((d) => d.id)).toEqual([2, 4])
  })
})

describe('resolveDayStart', () => {
  const item = (id: number, routineDayId: number): RoutineItem => ({
    id,
    routineDayId,
    exerciseId: 11,
    targetSets: 3,
    targetReps: 10,
    restSec: 90,
    order: 1,
  })

  it("devuelve 'start' con los items del día elegido", () => {
    const map = new Map<number, RoutineItem[]>([
      [7, [item(1, 7), item(2, 7)]],
    ])
    const res = resolveDayStart(7, map)
    expect(res.kind).toBe('start')
    if (res.kind === 'start') {
      expect(res.items).toHaveLength(2)
      expect(res.items[0].exerciseId).toBe(11)
    }
  })

  it("devuelve 'empty' para un día con 0 items", () => {
    const map = new Map<number, RoutineItem[]>([[7, []]])
    expect(resolveDayStart(7, map)).toEqual({ kind: 'empty' })
  })

  it("devuelve 'empty' para un día ausente del mapa", () => {
    expect(resolveDayStart(7, new Map())).toEqual({ kind: 'empty' })
  })
})
