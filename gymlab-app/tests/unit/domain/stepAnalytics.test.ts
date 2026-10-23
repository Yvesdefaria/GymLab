// Tests TDD de la analítica pura del rediseño de /pasos (dirección C):
// tiempo caminando, validación de meta/alta manual, meses con datos, navegación
// entre meses y series de mes/año. Sin React ni Dexie.
import { describe, expect, it } from 'vitest'
import {
  MANUAL_STEPS_MAX,
  STEP_GOAL_MAX,
  STEP_GOAL_MIN,
  buildMonthSeries,
  buildYearSeries,
  currentMonthKey,
  estimateWalkingMinutes,
  getAdjacentMonthKey,
  getDaysWithData,
  getMonthEntries,
  getMonthTotal,
  getMonthsWithData,
  parseManualSteps,
  parseStepGoal,
} from '@/domain/stepAnalytics'
import type { DailyStepsEntry } from '@/domain/types'

const entry = (localDate: string, steps: number): DailyStepsEntry => ({
  id: 1,
  localDate,
  steps,
  distanceKm: 0,
  calories: 0,
  source: 'manual',
  syncedAt: '',
})

describe('estimateWalkingMinutes', () => {
  it('convierte pasos a minutos caminando a 100 pasos/min', () => {
    expect(estimateWalkingMinutes(6_180)).toBe(62)
    expect(estimateWalkingMinutes(100)).toBe(1)
    expect(estimateWalkingMinutes(7_000)).toBe(70)
  })

  it('redondea al minuto más cercano', () => {
    expect(estimateWalkingMinutes(149)).toBe(1)
    expect(estimateWalkingMinutes(150)).toBe(2)
  })

  it('devuelve 0 para valores no positivos o inválidos', () => {
    expect(estimateWalkingMinutes(0)).toBe(0)
    expect(estimateWalkingMinutes(-20)).toBe(0)
    expect(estimateWalkingMinutes(Number.NaN)).toBe(0)
    expect(estimateWalkingMinutes(Number.POSITIVE_INFINITY)).toBe(0)
  })
})

describe('parseStepGoal', () => {
  it('acepta un entero dentro del rango', () => {
    expect(parseStepGoal('7000')).toEqual({ value: 7_000, error: null })
    expect(parseStepGoal('20000')).toEqual({ value: 20_000, error: null })
    expect(parseStepGoal(String(STEP_GOAL_MIN))).toEqual({ value: STEP_GOAL_MIN, error: null })
    expect(parseStepGoal(String(STEP_GOAL_MAX))).toEqual({ value: STEP_GOAL_MAX, error: null })
  })

  it('ignora separadores de miles y espacios', () => {
    expect(parseStepGoal('7.000')).toEqual({ value: 7_000, error: null })
    expect(parseStepGoal(' 12 000 ')).toEqual({ value: 12_000, error: null })
  })

  it('marca vacío cuando no hay dígitos', () => {
    expect(parseStepGoal('')).toEqual({ value: null, error: 'empty' })
    expect(parseStepGoal('abc')).toEqual({ value: null, error: 'empty' })
  })

  it('marca mínimo y máximo fuera de rango', () => {
    expect(parseStepGoal('999')).toEqual({ value: 999, error: 'min' })
    expect(parseStepGoal('50001')).toEqual({ value: 50_001, error: 'max' })
  })
})

describe('parseManualSteps', () => {
  it('acepta 0 y el máximo', () => {
    expect(parseManualSteps('0')).toEqual({ value: 0, error: null })
    expect(parseManualSteps(String(MANUAL_STEPS_MAX))).toEqual({
      value: MANUAL_STEPS_MAX,
      error: null,
    })
  })

  it('acepta un total normal con separadores', () => {
    expect(parseManualSteps('6.180')).toEqual({ value: 6_180, error: null })
  })

  it('marca vacío o fuera de rango', () => {
    expect(parseManualSteps('')).toEqual({ value: null, error: 'empty' })
    expect(parseManualSteps('100001')).toEqual({ value: 100_001, error: 'max' })
  })
})

describe('currentMonthKey', () => {
  it('extrae YYYY-MM de una fecha local', () => {
    expect(currentMonthKey('2026-10-23')).toBe('2026-10')
    expect(currentMonthKey('2026-01-01')).toBe('2026-01')
  })
})

describe('getMonthEntries / getMonthTotal / getDaysWithData', () => {
  const entries = [
    entry('2026-09-30', 9_000),
    entry('2026-10-01', 7_000),
    entry('2026-10-02', 0),
    entry('2026-10-03', 8_500),
    entry('2026-11-01', 10_000),
  ]

  it('filtra por prefijo de mes', () => {
    expect(getMonthEntries(entries, '2026-10').map((e) => e.localDate)).toEqual([
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
    ])
  })

  it('suma solo los pasos del mes pedido', () => {
    expect(getMonthTotal(getMonthEntries(entries, '2026-10'))).toBe(15_500)
  })

  it('cuenta días con datos (> 0), no días con registro en cero', () => {
    expect(getDaysWithData(getMonthEntries(entries, '2026-10'))).toBe(2)
  })
})

describe('getMonthsWithData / getAdjacentMonthKey', () => {
  const entries = [
    entry('2026-08-10', 0),
    entry('2026-09-10', 7_500),
    entry('2026-10-10', 8_000),
  ]

  it('incluye el mes vigente aunque no tenga datos y ordena ascendente', () => {
    expect(getMonthsWithData(entries, '2026-11')).toEqual([
      '2026-09',
      '2026-10',
      '2026-11',
    ])
  })

  it('ignora meses con registros en cero', () => {
    expect(getMonthsWithData(entries, '2026-10')).toEqual(['2026-09', '2026-10'])
  })

  it('salta meses sin datos al ir hacia atrás', () => {
    expect(getAdjacentMonthKey(['2026-09', '2026-10'], '2026-10', -1)).toBe('2026-09')
  })

  it('no permite avanzar más allá del mes vigente', () => {
    expect(getAdjacentMonthKey(['2026-09', '2026-10'], '2026-10', 1)).toBeNull()
  })

  it('permite volver al siguiente mes con datos desde uno pasado', () => {
    expect(getAdjacentMonthKey(['2026-09', '2026-10'], '2026-09', 1)).toBe('2026-10')
  })

  it('deshabilita atrás cuando no hay meses anteriores', () => {
    expect(getAdjacentMonthKey(['2026-09', '2026-10'], '2026-09', -1)).toBeNull()
  })

  it('devuelve null si el mes actual no está en la lista', () => {
    expect(getAdjacentMonthKey(['2026-09'], '2026-12', -1)).toBeNull()
  })
})

describe('buildMonthSeries', () => {
  it('en el mes vigente corta en el día de hoy', () => {
    const series = buildMonthSeries(
      [entry('2026-10-01', 7_000), entry('2026-10-23', 6_180)],
      '2026-10',
      '2026-10-23',
    )

    expect(series).toHaveLength(23)
    expect(series[0]).toEqual({ date: '2026-10-01', day: 1, steps: 7_000 })
    expect(series[22]).toEqual({ date: '2026-10-23', day: 23, steps: 6_180 })
  })

  it('en un mes pasado incluye todos los días del mes', () => {
    const series = buildMonthSeries([], '2026-09', '2026-10-23')

    expect(series).toHaveLength(30)
    expect(series[29].day).toBe(30)
    expect(series.every((p) => p.steps === 0)).toBe(true)
  })

  it('en un mes futuro devuelve una serie vacía', () => {
    expect(buildMonthSeries([], '2026-11', '2026-10-23')).toEqual([])
  })
})

describe('buildYearSeries', () => {
  const entries = [
    entry('2026-01-10', 10_000),
    entry('2026-01-20', 5_000),
    entry('2026-10-23', 6_180),
    entry('2025-12-31', 99_000),
  ]

  it('devuelve 12 meses con el total del año pedido', () => {
    const series = buildYearSeries(entries, 2026, '2026-10-23')

    expect(series).toHaveLength(12)
    expect(series[0]).toMatchObject({ key: '2026-01', steps: 15_000, isCurrent: false, isFuture: false })
    expect(series[9]).toMatchObject({ key: '2026-10', steps: 6_180, isCurrent: true, isFuture: false })
    expect(series[10]).toMatchObject({ key: '2026-11', steps: 0, isCurrent: false, isFuture: true })
    expect(series[11]).toMatchObject({ key: '2026-12', steps: 0, isCurrent: false, isFuture: true })
  })

  it('ignora los registros de otros años', () => {
    const series = buildYearSeries(entries, 2026, '2026-10-23')
    expect(series.reduce((sum, p) => sum + p.steps, 0)).toBe(21_180)
  })
})
