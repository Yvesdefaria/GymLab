// Tests del nuevo helper de la tab Rachas: grid de últimos 30 días y siguiente hito de insignia.
import { describe, expect, it } from 'vitest'
import { buildThirtyDayGrid, nextStreakBadge } from '@/domain/streak'

describe('buildThirtyDayGrid', () => {
  it('devuelve 30 días terminando en hoy (último elemento)', () => {
    const grid = buildThirtyDayGrid([], '2026-08-30')
    expect(grid).toHaveLength(30)
    expect(grid[29].date).toBe('2026-08-30')
    expect(grid[0].date).toBe('2026-08-01')
  })

  it('marca como entrenado los días presentes en el set', () => {
    const grid = buildThirtyDayGrid(['2026-08-28', '2026-08-30'], '2026-08-30')
    const trained = grid.filter((d) => d.trained).map((d) => d.date)
    expect(trained).toEqual(['2026-08-28', '2026-08-30'])
  })

  it('no marca fechas fuera de la ventana de 30 días', () => {
    const grid = buildThirtyDayGrid(['2026-07-20', '2026-08-30'], '2026-08-30')
    const trained = grid.filter((d) => d.trained).map((d) => d.date)
    expect(trained).toEqual(['2026-08-30'])
  })
})

describe('nextStreakBadge', () => {
  it('devuelve el hito de 7 días cuando la racha es pequeña', () => {
    expect(nextStreakBadge(3)).toEqual({ target: 7, remaining: 4 })
  })

  it('devuelve el hito de 30 días a partir de 7', () => {
    expect(nextStreakBadge(7)).toEqual({ target: 30, remaining: 23 })
  })

  it('devuelve el hito de 100 días a partir de 30', () => {
    expect(nextStreakBadge(30)).toEqual({ target: 100, remaining: 70 })
  })

  it('devuelve null al superar 100 días', () => {
    expect(nextStreakBadge(100)).toBeNull()
    expect(nextStreakBadge(0)).toBeNull()
  })
})