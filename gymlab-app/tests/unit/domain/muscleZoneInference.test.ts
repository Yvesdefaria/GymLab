import { describe, expect, it } from 'vitest'
import { inferZones } from '@/domain/muscleZoneInference'
import type { Exercise } from '@/domain/types'

const ex = (g: Exercise['muscleGroup'], name: string, slug = '', externalId = '') =>
  ({ muscleGroup: g, name, slug, externalId }) as Exercise

describe('inferZones', () => {
  it('no infiere nada para un grupo sin pistas', () => {
    expect(inferZones(ex('pecho', 'Ejercicio genérico', 'generic'))).toEqual([])
  })

  it('identifica curl femoral como femoral', () => {
    expect(inferZones(ex('pierna', 'Curl femoral', 'curl-femoral', 'Leg_Curl'))).toContain('pierna:femoral')
  })

  it('identifica elevación de gemelos como gemelo', () => {
    expect(inferZones(ex('pierna', 'Elevación de gemelos', 'calf-raise', 'Calf_Raise'))).toContain('pierna:gemelo')
  })

  it('identifica extensión/leg extension como cuadriceps', () => {
    expect(inferZones(ex('pierna', 'Extensión de piernas', 'leg-extension', 'Leg_Extension'))).toContain('pierna:cuadriceps')
  })

  it('identifica press inclinado como pecho superior', () => {
    expect(inferZones(ex('pecho', 'Press inclinado', 'incline-press', 'Incline_Press'))).toContain('pecho:superior')
  })

  it('las zonas devueltas pertenecen al grupo del ejercicio', () => {
    const zones = inferZones(ex('pierna', 'Curl femoral sentado', 'seated-leg-curl'))
    for (const z of zones) {
      expect(z.startsWith('pierna:')).toBe(true)
    }
  })

  it('ignora pistas de otro grupo (sin contaminación cruzada)', () => {
    const zones = inferZones(ex('pecho', 'Curl femoral', 'curl-femoral'))
    expect(zones.some((z) => z.startsWith('pierna:'))).toBe(false)
  })
})
