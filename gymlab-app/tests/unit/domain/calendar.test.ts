import { describe, expect, it } from 'vitest'
import { estimateWorkoutMinutes, programProgressPct } from '@/domain/calendar'
import type { ActiveProgram } from '@/domain/types'

const makeProgram = (overrides: Partial<ActiveProgram> = {}): ActiveProgram => ({
  id: 1,
  routineId: 1,
  startDate: '2026-08-11',
  weekdays: [1, 3, 5],
  createdAt: '2026-08-11T00:00:00.000Z',
  ...overrides,
})

describe('estimateWorkoutMinutes', () => {
  it('estima series × (45s + descanso) + 1 min por serie', () => {
    // 1 ejercicio: 4 series × (45s + 90s) = 540s = 9 min, + 4 = 13
    expect(estimateWorkoutMinutes([{ targetSets: 4, restSec: 90 }])).toBe(13)
  })

  it('suma varios ejercicios', () => {
    // 4×(45+90)=540 + 3×(45+60)=315 → 855s = 14.25 → 14 min, + 7 series = 21
    expect(estimateWorkoutMinutes([
      { targetSets: 4, restSec: 90 },
      { targetSets: 3, restSec: 60 },
    ])).toBe(21)
  })

  it('permite override de segundos por serie', () => {
    // 2 series × (30 + 60) = 180s = 3 min, + 2 = 5
    expect(estimateWorkoutMinutes([{ targetSets: 2, restSec: 60 }], 30)).toBe(5)
  })

  it('nunca baja de 1 minuto', () => {
    expect(estimateWorkoutMinutes([])).toBe(1)
  })
})

describe('programProgressPct (F136.6 ventana móvil de 28 días)', () => {
  it('solo cuenta los últimos 28 días: 4 de 12 = 33 %', () => {
    const pct = programProgressPct(
      ['2026-10-07', '2026-10-12', '2026-10-21', '2026-10-26'],
      makeProgram(),
      3,
      28,
      '2026-11-03',
    )
    expect(pct).toBe(33)
  })

  it('ignora entrenos fuera de la ventana (no se congela en las primeras 8 semanas)', () => {
    const pct = programProgressPct(
      ['2026-08-12', '2026-08-17', '2026-08-19', '2026-10-07', '2026-10-12', '2026-10-21', '2026-10-26'],
      makeProgram(),
      3,
      28,
      '2026-11-03',
    )
    expect(pct).toBe(33)
  })

  it('respeta el inicio del programa si cae dentro de la ventana', () => {
    const pct = programProgressPct(
      ['2026-10-26'],
      makeProgram({ startDate: '2026-10-26' }),
      3,
      28,
      '2026-11-03',
    )
    // 26/10, 28/10, 30/10 y 2/11 = 4 planificados; 1 hecho = 25 %
    expect(pct).toBe(25)
  })

  it('redondea 12,5 → 13', () => {
    // Lunes y miércoles en la ventana: 8 planificados; 1 hecho = 12,5 %
    const pct = programProgressPct(
      ['2026-10-07'],
      makeProgram({ weekdays: [1, 3] }),
      2,
      28,
      '2026-11-03',
    )
    expect(pct).toBe(13)
  })

  it('devuelve 0 sin días planificados', () => {
    expect(programProgressPct(['2026-11-02'], makeProgram({ weekdays: [] }), 3, 28, '2026-11-03')).toBe(0)
    expect(programProgressPct(['2026-11-02'], makeProgram(), 0, 28, '2026-11-03')).toBe(0)
  })

  it('devuelve 0 si el programa empieza después de hoy', () => {
    expect(
      programProgressPct([], makeProgram({ startDate: '2026-12-01' }), 3, 28, '2026-11-03'),
    ).toBe(0)
  })

  it('una ventana de 7 días cuenta solo la última semana', () => {
    // 28/10, 30/10 y 2/11 son los planificados de la ventana 28-10 … 3-11
    expect(
      programProgressPct(
        ['2026-10-28', '2026-10-30', '2026-11-02'],
        makeProgram(),
        3,
        7,
        '2026-11-03',
      ),
    ).toBe(100)
  })
})
