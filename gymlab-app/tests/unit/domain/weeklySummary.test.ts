/**
 * F139.4 — El resumen semanal usa el contrato único del par semana actual/anterior:
 * semana calendario, delta null y tono neutro cuando la anterior vale 0.
 */
import { describe, expect, it } from 'vitest'
import { buildWeeklySummary } from '@/domain/weeklySummary'
import { buildWeeklyVolumeSeries } from '@/domain/weeklyVolume'
import type { StreakResult, Workout } from '@/domain/types'

const streak: StreakResult = { currentStreak: 1, longestStreak: 2, lastWorkoutDate: null }

const workout = (localDate: string, totalVolume: number): Workout => ({
  id: Number(localDate.replaceAll('-', '')),
  startedAt: `${localDate}T10:00:00`,
  finishedAt: `${localDate}T11:00:00`,
  localDate,
  routineId: null,
  routineDayId: null,
  notes: '',
  totalVolume,
})

const NOW = new Date(2026, 9, 23, 12, 0, 0) // viernes 2026-10-23

describe('buildWeeklySummary', () => {
  it('compara la semana calendario con la anterior', () => {
    const summary = buildWeeklySummary(
      [workout('2026-10-20', 12_000), workout('2026-10-13', 10_000)],
      [],
      streak,
      new Map(),
      NOW,
    )

    expect(summary?.sessions).toBe(1)
    expect(summary?.prevSessions).toBe(1)
    expect(summary?.volume).toBe(12_000)
    expect(summary?.prevVolume).toBe(10_000)
    expect(summary?.volumePct).toBe(20)
    expect(summary?.tone).toBe('positive')
  })

  it('sin volumen previo: volumePct null y tono neutro', () => {
    const summary = buildWeeklySummary(
      [workout('2026-10-20', 8_000), workout('2026-10-21', 0)],
      [],
      streak,
      new Map(),
      NOW,
    )

    expect(summary?.prevVolume).toBe(0)
    expect(summary?.volumePct).toBeNull()
    expect(summary?.tone).toBe('neutral')
  })

  // F140.1: la home usa summary.volume; debe coincidir con la última barra de la
  // serie semanal en los bordes (semana vacía, solo semanas previas, domingo/lunes).
  it('volume coincide con la última barra de buildWeeklyVolumeSeries', () => {
    const cases: Workout[][] = [
      [],
      [workout('2026-10-06', 5_000)],
      [workout('2026-10-18', 4_000), workout('2026-10-19', 6_000)],
    ]

    for (const workouts of cases) {
      const summary = buildWeeklySummary(workouts, [], streak, new Map(), NOW)
      const series = buildWeeklyVolumeSeries(workouts, new Map(), 5, NOW)
      expect(summary?.volume ?? 0).toBe(series.at(-1)?.volume ?? 0)
    }
  })
})
