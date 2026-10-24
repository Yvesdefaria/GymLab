// Tests del catálogo de rutinas: conteo de ejercicios por rutina, filtros combinados
// (búsqueda + objetivo + nivel + tipo) y número de semana del programa activo.
import { describe, expect, it } from 'vitest'
import {
  countItemsByRoutine,
  programWeekNumber,
  routineMatchesFilters,
  type RoutineCatalogFilter,
} from '@/domain/routines'
import type { Routine, RoutineDay, RoutineItem } from '@/domain/types'

const routine = (patch: Partial<Routine> & { id: number }): Routine => ({
  slug: `rutina-${patch.id}`,
  title: `Rutina ${patch.id}`,
  objective: 'general',
  level: 'principiante',
  description: '',
  daysCount: 3,
  ...patch,
})

const day = (id: number, routineId: number): RoutineDay => ({
  id,
  routineId,
  dayIndex: 0,
  name: `Día ${id}`,
})

const item = (id: number, routineDayId: number): RoutineItem => ({
  id,
  routineDayId,
  exerciseId: 100 + id,
  targetSets: 3,
  targetReps: 10,
  restSec: 90,
  order: 1,
})

const filters = (patch: Partial<RoutineCatalogFilter> = {}): RoutineCatalogFilter => ({
  objective: null,
  level: null,
  type: 'todas',
  ...patch,
})

describe('countItemsByRoutine', () => {
  const days = [day(1, 10), day(2, 10), day(3, 20), day(4, 30)]

  it('suma los items de todos los días de cada rutina', () => {
    const items = [item(1, 1), item(2, 1), item(3, 2), item(4, 3)]
    expect(countItemsByRoutine(days, items)).toEqual({ 10: 3, 20: 1, 30: 0 })
  })

  it('incluye en 0 las rutinas con días pero sin items', () => {
    expect(countItemsByRoutine(days, [item(1, 3)])).toEqual({ 10: 0, 20: 1, 30: 0 })
  })

  it('ignora items cuyo día no pertenece a ninguna rutina', () => {
    const items = [item(1, 1), item(2, 999)]
    expect(countItemsByRoutine(days, items)).toEqual({ 10: 1, 20: 0, 30: 0 })
  })

  it('sin días devuelve un record vacío', () => {
    expect(countItemsByRoutine([], [item(1, 1)])).toEqual({})
  })
})

describe('routineMatchesFilters', () => {
  const ppl = routine({ id: 1, title: 'PPL Volumen', objective: 'volumen', level: 'intermedio', daysCount: 3 })
  const wendler = routine({ id: 2, title: '5/3/1 Wendler', objective: 'fuerza', level: 'avanzado', daysCount: 4 })
  const express = routine({ id: 3, title: 'Pierna express', objective: 'definicion', level: 'intermedio', daysCount: 1 })

  it('sin criterios acepta todo', () => {
    expect(routineMatchesFilters(ppl, 'PPL Volumen', filters(), '')).toBe(true)
  })

  it('la búsqueda compara el título localizado, sin distinguir mayúsculas ni espacios', () => {
    expect(routineMatchesFilters(ppl, 'PPL Volumen', filters(), '  ppl ')).toBe(true)
    expect(routineMatchesFilters(ppl, 'PPL Volumen', filters(), 'wendler')).toBe(false)
  })

  it('filtra por objetivo, nivel y tipo a la vez', () => {
    expect(routineMatchesFilters(ppl, 'PPL Volumen', filters({ objective: 'volumen' }), '')).toBe(true)
    expect(routineMatchesFilters(ppl, 'PPL Volumen', filters({ objective: 'fuerza' }), '')).toBe(false)
    expect(routineMatchesFilters(ppl, 'PPL Volumen', filters({ level: 'avanzado' }), '')).toBe(false)
    expect(routineMatchesFilters(ppl, 'PPL Volumen', filters({ type: 'programa' }), '')).toBe(true)
    expect(routineMatchesFilters(ppl, 'PPL Volumen', filters({ type: 'sesion' }), '')).toBe(false)
    expect(routineMatchesFilters(express, 'Pierna express', filters({ type: 'sesion' }), '')).toBe(true)
    expect(routineMatchesFilters(express, 'Pierna express', filters({ type: 'programa' }), '')).toBe(false)
  })

  it('exige que se cumplan todos los criterios juntos', () => {
    expect(routineMatchesFilters(wendler, '5/3/1 Wendler', filters({ objective: 'fuerza', level: 'avanzado', type: 'programa' }), 'wendler')).toBe(true)
    expect(routineMatchesFilters(wendler, '5/3/1 Wendler', filters({ objective: 'fuerza', level: 'avanzado', type: 'programa' }), 'ppl')).toBe(false)
  })
})

describe('programWeekNumber', () => {
  it('el día de inicio es la semana 1', () => {
    expect(programWeekNumber('2026-10-24', '2026-10-24')).toBe(1)
  })

  it('mantiene la semana 1 hasta el día 6 y abre la 2 en el día 7', () => {
    expect(programWeekNumber('2026-10-24', '2026-10-30')).toBe(1)
    expect(programWeekNumber('2026-10-24', '2026-10-31')).toBe(2)
    expect(programWeekNumber('2026-10-24', '2026-11-13')).toBe(3)
  })

  it('cruza el cambio de mes sin desfase', () => {
    expect(programWeekNumber('2026-01-28', '2026-02-04')).toBe(2)
  })

  it('una fecha futura se trata como semana 1', () => {
    expect(programWeekNumber('2026-10-24', '2026-10-20')).toBe(1)
  })
})
