// Tests del último peso corporal registrado (S3): el prefill de calculadoras
// necesita el peso más reciente aunque el repositorio entregue las filas desordenadas.
import { describe, expect, it } from 'vitest'
import { latestWeightKg } from '@/domain/bodyProfile'

describe('latestWeightKg', () => {
  it('sin registros devuelve null', () => {
    expect(latestWeightKg([])).toBeNull()
  })

  it('devuelve el peso de la fecha más reciente', () => {
    expect(
      latestWeightKg([
        { localDate: '2026-10-01', weightKg: 78.5 },
        { localDate: '2026-10-20', weightKg: 75.2 },
        { localDate: '2026-10-10', weightKg: 77.1 },
      ]),
    ).toBe(75.2)
  })

  it('con una sola entrada devuelve ese peso', () => {
    expect(latestWeightKg([{ localDate: '2026-10-22', weightKg: 74 }])).toBe(74)
  })
})
