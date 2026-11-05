/**
 * F139.4 — Contrato único del par semana actual/anterior: volumen de la semana
 * calendario (lunes–domingo), delta y tono. `previous = 0` es neutro: un porcentaje
 * desde cero no está definido y no se inventa un +100 %.
 */
import { describe, expect, it } from 'vitest'
import {
  compareWeekVolume,
  WEEK_VOLUME_ALERT_PCT,
  WEEK_VOLUME_POSITIVE_PCT,
} from '@/domain/weekVolume'
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

const TODAY = '2026-10-23' // viernes; semana actual 2026-10-19..25, previa 10-12..18

describe('compareWeekVolume', () => {
  it('suma la semana actual y la anterior e ignora otras semanas', () => {
    const cmp = compareWeekVolume(
      [
        workout('2026-10-20', 10_000),
        workout('2026-10-22', 5_000),
        workout('2026-10-13', 12_000),
        workout('2026-10-14', 3_000),
        workout('2026-10-01', 99_000),
      ],
      new Map(),
      TODAY,
    )

    expect(cmp.current).toBe(15_000)
    expect(cmp.previous).toBe(15_000)
    expect(cmp.deltaPct).toBe(0)
    expect(cmp.tone).toBe('neutral')
  })

  it('marca positivo desde el umbral de +5 % y alerta desde −10 %', () => {
    const up = compareWeekVolume(
      [workout('2026-10-20', 10_500), workout('2026-10-13', 10_000)],
      new Map(),
      TODAY,
    )
    const down = compareWeekVolume(
      [workout('2026-10-20', 8_000), workout('2026-10-13', 10_000)],
      new Map(),
      TODAY,
    )

    expect(up.deltaPct).toBe(5)
    expect(up.tone).toBe('positive')
    expect(down.deltaPct).toBe(-20)
    expect(down.tone).toBe('alert')
    expect(WEEK_VOLUME_POSITIVE_PCT).toBe(5)
    expect(WEEK_VOLUME_ALERT_PCT).toBe(-10)
  })

  it('sin volumen previo devuelve delta null y tono neutro', () => {
    const cmp = compareWeekVolume([workout('2026-10-20', 8_000)], new Map(), TODAY)

    expect(cmp.current).toBe(8_000)
    expect(cmp.previous).toBe(0)
    expect(cmp.deltaPct).toBeNull()
    expect(cmp.tone).toBe('neutral')
  })

  it('sin entrenos devuelve todo en cero y neutro', () => {
    const cmp = compareWeekVolume([], new Map(), TODAY)

    expect(cmp.current).toBe(0)
    expect(cmp.previous).toBe(0)
    expect(cmp.deltaPct).toBeNull()
    expect(cmp.tone).toBe('neutral')
  })
})
