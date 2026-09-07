// Tests del moldeado puro de datos del dashboard de pasos (F84b): las series
// semanales y el heatmap mensual se generan aquí para mantener los componentes
// de presentación libres de lógica.
import { describe, it, expect } from 'vitest'
import { buildWeekSeries } from '@/components/steps/stepSeries'
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

describe('buildWeekSeries', () => {
  const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  it('devuelve 7 puntos de lunes a domingo de la semana de today, todos a 0', () => {
    const series = buildWeekSeries([], '2026-09-08', labels) // martes

    expect(series).toHaveLength(7)
    expect(series.map((p) => p.date)).toEqual([
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
    ])
    expect(series.map((p) => p.label)).toEqual(labels)
    expect(series.every((p) => p.steps === 0)).toBe(true)
  })

  it('marca como hoy únicamente el punto con la fecha de today', () => {
    const series = buildWeekSeries([], '2026-09-08', labels)
    const marked = series.filter((p) => p.isToday)

    expect(marked).toHaveLength(1)
    expect(marked[0].date).toBe('2026-09-08')
  })

  it('mapea los pasos de cada día a su punto y rellena con 0 los días sin registro', () => {
    const series = buildWeekSeries(
      [
        entry('2026-09-07', 5_000),
        entry('2026-09-08', 8_432),
        entry('2026-09-10', 12_000),
      ],
      '2026-09-08',
      labels,
    )

    expect(series.map((p) => p.steps)).toEqual([5_000, 8_432, 0, 12_000, 0, 0, 0])
  })

  it('ignora los registros de fuera de la semana actual', () => {
    const series = buildWeekSeries(
      [entry('2026-09-14', 9_000), entry('2026-08-31', 1)],
      '2026-09-08',
      labels,
    )

    expect(series.every((p) => p.steps === 0)).toBe(true)
  })

  it('funciona cuando today es lunes (inicio de semana)', () => {
    const series = buildWeekSeries([], '2026-09-07', labels)

    expect(series[0].date).toBe('2026-09-07')
    expect(series[0].isToday).toBe(true)
    expect(series[6].date).toBe('2026-09-13')
  })

  it('funciona cuando today es domingo (fin de semana)', () => {
    const series = buildWeekSeries([], '2026-09-13', labels)

    expect(series[0].date).toBe('2026-09-07')
    expect(series[6].date).toBe('2026-09-13')
    expect(series[6].isToday).toBe(true)
  })

  it('respeta las etiquetas de día que recibe por parámetro', () => {
    const series = buildWeekSeries([], '2026-09-08', ['a', 'b', 'c', 'd', 'e', 'f', 'g'])

    expect(series.map((p) => p.label)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
  })
})