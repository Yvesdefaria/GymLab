// Tests del moldeado puro de datos del dashboard de pasos (F84b): las series
// semanales y el heatmap mensual se generan aquí para mantener los componentes
// de presentación libres de lógica.
import { describe, it, expect } from 'vitest'
import { buildWeekSeries, buildHeatmapGrid } from '@/components/steps/stepSeries'
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

describe('buildHeatmapGrid', () => {
  it('genera la grilla desde el lunes de la semana del día 1 del mes', () => {
    // Febrero 2026 empieza en domingo → el lunes de esa semana es el 26 de enero.
    const cells = buildHeatmapGrid('2026-02', [], {})

    expect(cells[0].date).toBe('2026-01-26')
    expect(cells[34].date).toBe('2026-03-01')
  })

  it('marca como fuera de mes las celdas de cabecera y cola', () => {
    const cells = buildHeatmapGrid('2026-02', [], {})

    expect(cells.length).toBe(35)
    expect(cells.filter((c) => !c.inMonth).map((c) => c.date)).toEqual([
      '2026-01-26',
      '2026-01-27',
      '2026-01-28',
      '2026-01-29',
      '2026-01-30',
      '2026-01-31',
      '2026-03-01',
    ])
  })

  it('incluye todos los días del mes (28 días de febrero alineados)', () => {
    const cells = buildHeatmapGrid('2026-02', [], {})

    const inMonth = cells.filter((c) => c.inMonth)
    expect(inMonth).toHaveLength(28)
    expect(cells[6].date).toBe('2026-02-01')
    expect(cells[33].date).toBe('2026-02-28')
  })

  it('visualiza meses de 30 días completos (septiembre 2026)', () => {
    // Septiembre 2026 empieza en martes → el lunes de esa semana es el 31 de agosto.
    const cells = buildHeatmapGrid('2026-09', [], {})

    expect(cells[0].date).toBe('2026-08-31')
    expect(cells.filter((c) => c.inMonth)).toHaveLength(30)
  })

  it('crece a 6 filas cuando un mes de 31 días no cabe en 35 celdas (agosto 2026)', () => {
    // Agosto 2026 empieza en sábado: 5 días de cabecera + 31 → 36 celdas = 6 filas.
    const cells = buildHeatmapGrid('2026-08', [], {})

    expect(cells).toHaveLength(42)
    const inMonth = cells.filter((c) => c.inMonth)
    expect(inMonth).toHaveLength(31)
    expect(cells[5].date).toBe('2026-08-01')
    expect(cells[35].date).toBe('2026-08-31')
  })

  it('rellena pasos e intensidad por día y usa 0 fuera de los registros', () => {
    const cells = buildHeatmapGrid('2026-02', [entry('2026-02-05', 8_000)], { '2026-02-05': 4 })

    expect(cells[10].date).toBe('2026-02-05')
    expect(cells[10].steps).toBe(8_000)
    expect(cells[10].level).toBe(4)
    expect(cells[10].inMonth).toBe(true)
    expect(cells[9].steps).toBe(0)
    expect(cells[9].level).toBe(0)
  })

  it('ignora los pasos de días fuera del mes', () => {
    const cells = buildHeatmapGrid('2026-02', [entry('2026-01-30', 9_999)], {})

    expect(cells[4].steps).toBe(0)
    expect(cells[4].inMonth).toBe(false)
  })
})