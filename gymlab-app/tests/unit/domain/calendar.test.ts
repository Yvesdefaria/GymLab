import { describe, expect, it } from 'vitest'
import { estimateWorkoutMinutes } from '@/domain/calendar'

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
