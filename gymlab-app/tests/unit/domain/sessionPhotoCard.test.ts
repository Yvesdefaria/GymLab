// Tests del contrato puro del card con foto (F93 #15): recorte cover y línea de stats.
import { describe, expect, it } from 'vitest'
import { buildStatsLine, computeCoverCrop } from '@/domain/sessionPhotoCard'

describe('computeCoverCrop', () => {
  it('imagen cuadrada: recorte completo sin desplazamiento', () => {
    expect(computeCoverCrop(1080, 1080, 1080)).toEqual({ sx: 0, sy: 0, sw: 1080, sh: 1080 })
  })

  it('imagen apaisada: recorta los costados y centra', () => {
    expect(computeCoverCrop(4000, 3000, 1080)).toEqual({ sx: 500, sy: 0, sw: 3000, sh: 3000 })
  })

  it('imagen vertical: recorta arriba/abajo y centra', () => {
    expect(computeCoverCrop(3000, 4000, 1080)).toEqual({ sx: 0, sy: 500, sw: 3000, sh: 3000 })
  })

  it('imagen menor al destino: igual se recorta a cuadrado (el escalado lo hace el canvas)', () => {
    expect(computeCoverCrop(800, 600, 1080)).toEqual({ sx: 100, sy: 0, sw: 600, sh: 600 })
  })

  it('dimensiones o destino inválidos: recorte vacío', () => {
    expect(computeCoverCrop(0, 100, 1080)).toEqual({ sx: 0, sy: 0, sw: 0, sh: 0 })
    expect(computeCoverCrop(100, -5, 1080)).toEqual({ sx: 0, sy: 0, sw: 0, sh: 0 })
    expect(computeCoverCrop(100, 100, 0)).toEqual({ sx: 0, sy: 0, sw: 0, sh: 0 })
  })
})

describe('buildStatsLine', () => {
  const esLabels = { volume: 'de volumen', prOne: 'PR', prMany: 'PRs' }

  it('arma volumen + PRs en plural', () => {
    expect(buildStatsLine('4.800 kg', 2, esLabels)).toEqual({
      volume: '4.800 kg de volumen',
      prs: '2 PRs',
    })
  })

  it('usa singular con 1 PR', () => {
    expect(buildStatsLine('4.800 kg', 1, esLabels)).toEqual({
      volume: '4.800 kg de volumen',
      prs: '1 PR',
    })
  })

  it('omite el segmento de PRs sin PRs', () => {
    expect(buildStatsLine('4.800 kg', 0, esLabels)).toEqual({
      volume: '4.800 kg de volumen',
      prs: null,
    })
  })

  it('inyecta las etiquetas en inglés sin cambiar el número', () => {
    expect(buildStatsLine('4,800 kg', 3, { volume: 'volume', prOne: 'PR', prMany: 'PRs' })).toEqual({
      volume: '4,800 kg volume',
      prs: '3 PRs',
    })
  })
})
