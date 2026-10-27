// Tests TDD del héroe de Stats (rediseño C1): volumen de la semana calendario
// y delta contra la semana anterior. Puro, sin React ni Dexie.
import { describe, expect, it } from 'vitest'
import { buildVolumeHero } from '@/domain/statsOverview'
import type { Workout } from '@/domain/types'

const workout = (localDate: string, totalVolume: number): Workout => ({
  id: 1,
  startedAt: `${localDate}T10:00:00`,
  finishedAt: `${localDate}T11:00:00`,
  routineId: null,
  routineDayId: null,
  localDate,
  notes: '',
  totalVolume,
})

const TODAY = '2026-10-23' // viernes; semana actual = 2026-10-19..25

describe('buildVolumeHero', () => {
  it('suma la semana actual y la anterior, e ignora otras semanas', () => {
    const hero = buildVolumeHero(
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

    expect(hero.current).toBe(15_000)
    expect(hero.previous).toBe(15_000)
    expect(hero.deltaPct).toBe(0)
  })

  it('calcula el delta porcentual contra la semana anterior', () => {
    const hero = buildVolumeHero(
      [workout('2026-10-20', 12_000), workout('2026-10-13', 10_000)],
      new Map(),
      TODAY,
    )

    expect(hero.deltaPct).toBe(20)
  })

  it('sin semana anterior no inventa un −100%', () => {
    const hero = buildVolumeHero([workout('2026-10-20', 8_000)], new Map(), TODAY)

    expect(hero.current).toBe(8_000)
    expect(hero.previous).toBe(0)
    expect(hero.deltaPct).toBeNull()
  })

  it('con semana anterior en cero no calcula delta', () => {
    const hero = buildVolumeHero(
      [workout('2026-10-20', 8_000), workout('2026-10-13', 0)],
      new Map(),
      TODAY,
    )

    expect(hero.deltaPct).toBeNull()
  })

  it('devuelve 0 cuando no hay entrenos en la semana actual', () => {
    const hero = buildVolumeHero([workout('2026-10-13', 10_000)], new Map(), TODAY)

    expect(hero.current).toBe(0)
    expect(hero.deltaPct).toBe(-100)
  })
})
