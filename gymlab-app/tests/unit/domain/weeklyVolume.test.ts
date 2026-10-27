import { describe, expect, it } from 'vitest'
import { buildWeeklyVolumeSeries } from '@/domain/weeklyVolume'

// Serie mínima con la forma que consume el dominio: fecha local + volumen legacy.
// El mapa de volúmenes va vacío para que `volumeOf` use el fallback de la fila.
const workout = (localDate: string, totalVolume: number) => ({
  id: 1,
  localDate,
  startedAt: `${localDate}T10:00:00`,
  totalVolume,
})

// Sábado 24 de octubre de 2026: la semana actual empieza el lunes 19.
const NOW = new Date(2026, 9, 24, 12)

describe('buildWeeklyVolumeSeries', () => {
  it('devuelve cinco semanas consecutivas terminando en la actual', () => {
    const series = buildWeeklyVolumeSeries([], new Map(), 5, NOW)

    expect(series.map((point) => point.weekStart)).toEqual([
      '2026-09-21',
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
    ])
    expect(series.at(-1)?.isCurrent).toBe(true)
    expect(series.filter((point) => point.isCurrent)).toHaveLength(1)
    expect(series.every((point) => point.volume === 0)).toBe(true)
  })

  it('suma el volumen por semana e ignora lo que cae fuera de la ventana', () => {
    const series = buildWeeklyVolumeSeries(
      [
        workout('2026-09-20', 999), // domingo anterior a la primera semana
        workout('2026-09-28', 1_000),
        workout('2026-10-01', 500),
        workout('2026-10-12', 2_000),
        workout('2026-10-19', 3_000),
        workout('2026-10-21', 250),
        workout('2026-11-02', 777), // futura
      ],
      new Map(),
      5,
      NOW,
    )

    expect(series.map((point) => point.volume)).toEqual([0, 1_500, 0, 2_000, 3_250])
  })

  it('permite pedir otra cantidad de semanas', () => {
    const series = buildWeeklyVolumeSeries([workout('2026-10-12', 800)], new Map(), 2, NOW)

    expect(series).toHaveLength(2)
    expect(series.map((point) => point.weekStart)).toEqual(['2026-10-12', '2026-10-19'])
    expect(series.map((point) => point.volume)).toEqual([800, 0])
  })

  it('devuelve una lista vacía si weeks no es positivo', () => {
    expect(buildWeeklyVolumeSeries([], new Map(), 0, NOW)).toEqual([])
    expect(buildWeeklyVolumeSeries([], new Map(), -3, NOW)).toEqual([])
  })
})
