/**
 * F139.4 — El insight semanal comparte el contrato único: semana calendario y
 * `previous = 0` neutro (delta null), sin el +100 % que mostraba antes.
 */
import { describe, expect, it } from 'vitest'
import { computeWeeklyVolumeInsight } from '@/domain/insights'
import type { Workout } from '@/domain/types'

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

describe('computeWeeklyVolumeInsight', () => {
  it('compara la semana calendario y marca positivo', () => {
    const insight = computeWeeklyVolumeInsight(
      [workout('2026-10-20', 12_000), workout('2026-10-13', 10_000)],
      new Map(),
      NOW,
    )

    expect(insight?.currentWeekVolume).toBe(12_000)
    expect(insight?.previousWeekVolume).toBe(10_000)
    expect(insight?.deltaPct).toBe(20)
    expect(insight?.tone).toBe('positive')
  })

  it('sin volumen previo no inventa +100 %: delta null y tono neutro', () => {
    const insight = computeWeeklyVolumeInsight(
      [workout('2026-10-20', 8_000), workout('2026-10-21', 0)],
      new Map(),
      NOW,
    )

    expect(insight).not.toBeNull()
    expect(insight?.previousWeekVolume).toBe(0)
    expect(insight?.deltaPct).toBeNull()
    expect(insight?.tone).toBe('neutral')
  })
})
