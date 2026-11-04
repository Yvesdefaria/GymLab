import { describe, expect, it } from 'vitest'
import {
  BAND_COVERAGE_MIN_PCT,
  buildVolumeStats,
  type CoverageReport,
  type VolumeCounts,
} from '@/domain/volumeModel'
import { VOLUME_GROUPS, type VolumeGroup } from '@/domain/volumeGroup'

const counts = (
  direct: Partial<Record<VolumeGroup, number>>,
  effective: Partial<Record<VolumeGroup, number>> = direct,
  unclassified = 0,
): VolumeCounts => ({
  direct,
  effective,
  excluded: 0,
  unclassified,
  total: Object.values(effective).reduce((sum, value) => sum + value, 0) + unclassified,
})

const coverage = (byCoarseGroup: CoverageReport['byCoarseGroup'] = {}): CoverageReport => ({
  total: 0,
  classified: 0,
  excluded: 0,
  unknown: 0,
  pct: 100,
  byCoarseGroup,
})

const stat = (
  stats: ReturnType<typeof buildVolumeStats>,
  group: VolumeGroup,
) => stats.find((entry) => entry.group === group)!

const fullCoverage = coverage({
  pierna: { total: 10, classified: 10, excluded: 0, unknown: 0 },
  pecho: { total: 10, classified: 10, excluded: 0, unknown: 0 },
  hombro: { total: 10, classified: 10, excluded: 0, unknown: 0 },
})

describe('buildVolumeStats', () => {
  it('marca dentro, bajo y alto según la banda semanal', () => {
    const stats = buildVolumeStats({
      counts: counts({ cuadriceps: 48, pecho: 44, espalda: 76 }),
      coverage: fullCoverage,
      weeks: 4,
    })
    expect(stat(stats, 'cuadriceps').state).toBe('dentro')
    expect(stat(stats, 'pecho').state).toBe('bajo')
    expect(stat(stats, 'espalda').state).toBe('alto')
  })

  it('los límites de la banda son inclusivos', () => {
    const stats = buildVolumeStats({
      counts: counts({ cuadriceps: 64, isquios: 48 }),
      coverage: fullCoverage,
      weeks: 4,
    })
    expect(stat(stats, 'cuadriceps').state).toBe('dentro')
    expect(stat(stats, 'isquios').state).toBe('dentro')
  })

  it('con solo volumen efectivo el grupo queda bajo, no sin datos', () => {
    const stats = buildVolumeStats({
      counts: counts({ triceps: 0 }, { triceps: 12 }),
      coverage: fullCoverage,
      weeks: 4,
    })
    expect(stat(stats, 'triceps').state).toBe('bajo')
    expect(stat(stats, 'triceps').effective).toBe(12)
  })

  it('sin series propias ni indirectas queda sin datos', () => {
    const stats = buildVolumeStats({
      counts: counts({ pecho: 48 }),
      coverage: fullCoverage,
      weeks: 4,
    })
    expect(stat(stats, 'gemelos').state).toBe('sin-datos')
  })

  it('con menos de 4 semanas marca datos parciales y nunca alerta', () => {
    const stats = buildVolumeStats({
      counts: counts({ pecho: 8 }),
      coverage: fullCoverage,
      weeks: 2,
      partial: true,
    })
    expect(stat(stats, 'pecho').state).toBe('datos-parciales')
    expect(stat(stats, 'pecho').alert).toBe(false)
  })

  it('sin semanas válidas no divide ni alerta', () => {
    const stats = buildVolumeStats({
      counts: counts({ pecho: 8 }),
      coverage: fullCoverage,
      weeks: 0,
    })
    expect(stat(stats, 'pecho').weekly).toBe(0)
    expect(stat(stats, 'pecho').alert).toBe(false)
  })

  it('un grupo con cobertura insuficiente queda sin clasificar y no alerta', () => {
    const stats = buildVolumeStats({
      counts: counts({ cuadriceps: 8 }),
      coverage: coverage({ pierna: { total: 10, classified: 7, excluded: 0, unknown: 3 } }),
      weeks: 4,
    })
    expect(stat(stats, 'cuadriceps').state).toBe('sin-clasificar')
    expect(stat(stats, 'cuadriceps').alert).toBe(false)
  })

  it('la cobertura justa en el umbral alcanza', () => {
    const stats = buildVolumeStats({
      counts: counts({ cuadriceps: 48 }),
      coverage: coverage({ pierna: { total: 10, classified: 9, excluded: 0, unknown: 1 } }),
      weeks: 4,
    })
    expect(BAND_COVERAGE_MIN_PCT).toBe(90)
    expect(stat(stats, 'cuadriceps').state).toBe('dentro')
  })

  it('trapecios solo alerta si la rutina los programa', () => {
    const base = { counts: counts({ trapecios: 8 }), coverage: fullCoverage, weeks: 4 }
    expect(stat(buildVolumeStats(base), 'trapecios').alert).toBe(false)
    expect(stat(buildVolumeStats({ ...base, scheduled: { trapecios: true } }), 'trapecios').alert).toBe(true)
    const inBand = buildVolumeStats({
      counts: counts({ trapecios: 16 }),
      coverage: fullCoverage,
      weeks: 4,
      scheduled: { trapecios: true },
    })
    expect(stat(inBand, 'trapecios').state).toBe('dentro')
    expect(stat(inBand, 'trapecios').alert).toBe(false)
  })

  it('el antebrazo nunca alerta', () => {
    const stats = buildVolumeStats({
      counts: counts({ antebrazo: 80 }),
      coverage: fullCoverage,
      weeks: 4,
    })
    expect(stat(stats, 'antebrazo').alert).toBe(false)
  })

  it('devuelve los 12 grupos en orden canónico', () => {
    const stats = buildVolumeStats({ counts: counts({}), coverage: fullCoverage, weeks: 4 })
    expect(stats.map((entry) => entry.group)).toEqual([...VOLUME_GROUPS])
  })
})
