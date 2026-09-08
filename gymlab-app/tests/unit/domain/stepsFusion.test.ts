import { describe, expect, it } from 'vitest'
import { mergeHealthSample } from '@/domain/stepsFusion'
import type { DailyStepsEntry } from '@/domain/types'

const APPLIED = '2026-09-08T10:15:00.000Z'
// Entrada fixture: día manual existente (no debe pisarse con health=0).
const manualDay = (localDate: string): DailyStepsEntry => ({
  id: 7,
  localDate,
  steps: 500,
  distanceKm: 0.35,
  calories: 20,
  source: 'manual',
  syncedAt: '2026-09-08T09:00:00.000Z',
})

describe('mergeHealthSample', () => {
  it('health > 0 reemplaza el día, con source phone y métricas recalculadas', () => {
    const out = mergeHealthSample('2026-09-08', manualDay('2026-09-08'), 8_000, 70, APPLIED)
    expect(out).toEqual({
      id: 7,
      localDate: '2026-09-08',
      steps: 8_000,
      distanceKm: 5.6, // 8000 × 70 / 100 / 1000
      calories: 320, // 8000 × 0.04
      source: 'phone',
      syncedAt: APPLIED,
    })
  })

  it('health > 0 reemplaza incluso si ya existía un registro manual', () => {
    const out = mergeHealthSample('2026-09-08', manualDay('2026-09-08'), 8_000, 70, APPLIED)
    expect(out?.source).toBe('phone')
    expect(out?.steps).toBe(8_000)
  })

  it('health = 0 nunca pisa: devuelve null (no tocar)', () => {
    const out = mergeHealthSample('2026-09-08', manualDay('2026-09-08'), 0, 70, APPLIED)
    expect(out).toBeNull()
  })

  it('sin registro y sin health → null', () => {
    const out = mergeHealthSample('2026-09-08', undefined, 0, 70, APPLIED)
    expect(out).toBeNull()
  })

  it('sin registro previo y health > 0 → crea el día con id 0', () => {
    const out = mergeHealthSample('2026-09-08', undefined, 12_000, 70, APPLIED)
    expect(out).toEqual({
      id: 0,
      localDate: '2026-09-08',
      steps: 12_000,
      distanceKm: 8.4,
      calories: 480,
      source: 'phone',
      syncedAt: APPLIED,
    })
  })

  it('usa la zancada recibida (no hardcodeada) para distancia y calorías', () => {
    const out = mergeHealthSample('2026-09-08', undefined, 10_000, 90, APPLIED)
    expect(out?.distanceKm).toBeCloseTo(9, 4)
    expect(out?.calories).toBe(400)
  })
})