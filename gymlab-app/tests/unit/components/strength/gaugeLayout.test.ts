// Tests del layout puro del gauge de fuerza (F104.2): las bandas pintadas deben
// corresponder a los umbrales reales de nivel (p50/p75/p90), no a las 4 marcas de
// percentil. El bug original corría cada color una banda y el marcador caía
// dentro de un color que no era su nivel.
import { describe, it, expect } from 'vitest'
import { computeGaugeLayout, type GaugeBand } from '@/components/strength/gaugeLayout'
import { getStrengthLevel, getStrengthThresholds } from '@/domain/strengthStandards'

// Banda que contiene a pct con borde start-inclusive: en el borde exacto manda
// la banda que empieza ahí (misma semántica que getStrengthLevel).
const bandAt = (bands: GaugeBand[], pct: number): GaugeBand => {
  let start = 0
  for (const band of bands) {
    const end = start + band.widthPct
    if (pct >= start - 1e-9 && pct < end - 1e-9) return band
    start = end
  }
  return bands[bands.length - 1]!
}

describe('computeGaugeLayout', () => {
  // Sentadilla con 80 kg de peso corporal: umbrales [p25, p50, p75, p90] = [80, 120, 160, 205].
  const thresholds = getStrengthThresholds('sentadilla', 80)

  it('reparte 4 bandas en orden con los límites de nivel p50/p75/p90 sobre maxVal = p90 * 1.1', () => {
    const { bands } = computeGaugeLayout(thresholds, 100)

    expect(bands.map((b) => b.level)).toEqual(['principiante', 'intermedio', 'avanzado', 'elite'])
    expect(bands[0]!.widthPct).toBeCloseTo(53.215, 2) // [0, p50)
    expect(bands[1]!.widthPct).toBeCloseTo(17.738, 2) // [p50, p75)
    expect(bands[2]!.widthPct).toBeCloseTo(19.955, 2) // [p75, p90)
    expect(bands[3]!.widthPct).toBeCloseTo(9.091, 2) // [p90, maxVal]
    expect(bands.reduce((sum, b) => sum + b.widthPct, 0)).toBeCloseTo(100, 6)
  })

  it('posiciona el marcador en la escala del gauge y lo acota a [0, 100]', () => {
    expect(computeGaugeLayout(thresholds, 100).markerPct).toBeCloseTo(44.346, 3)
    expect(computeGaugeLayout(thresholds, 500).markerPct).toBe(100)
    expect(computeGaugeLayout(thresholds, -5).markerPct).toBe(0)
  })

  it('la banda que contiene al marcador coincide con getStrengthLevel, bordes incluidos', () => {
    const samples = [79.9, 80, 119.9, 120, 160, 205, 224, 300]
    // Acumular discrepancias deja un diff legible si el invariante se rompe.
    const mismatches = samples.flatMap((e1rm) => {
      const { markerPct, bands } = computeGaugeLayout(thresholds, e1rm)
      const band = bandAt(bands, markerPct).level
      const level = getStrengthLevel('sentadilla', e1rm, 80)
      return band === level ? [] : [{ e1rm, band, level }]
    })

    expect(mismatches).toEqual([])
  })

  it('con umbrales degenerados ([0,0,0,0]) devuelve medida cero sin NaN', () => {
    const { markerPct, bands } = computeGaugeLayout([0, 0, 0, 0], 100)

    expect(markerPct).toBe(0)
    expect(bands).toHaveLength(4)
    expect(bands.every((b) => b.widthPct === 0)).toBe(true)
    expect(bands.every((b) => Number.isFinite(b.widthPct))).toBe(true)
  })
})
