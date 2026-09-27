// Convención del repo: se testea la lógica pura exportada del hook (el glue React se
// cubre con la regresión e2e); acá la decisión es «¿el onboarding ya quedó atrás?».
import { describe, expect, it } from 'vitest'
import { shouldRunStartupSync } from '@/hooks/useHealthSyncHost'

describe('shouldRunStartupSync', () => {
  it('espera a que Dexie resuelva el flag (done undefined) aunque haya workouts', () => {
    expect(shouldRunStartupSync(undefined, 0)).toBe(false)
    expect(shouldRunStartupSync(undefined, 3)).toBe(false)
  })

  it('con el wizard visible (done false y sin workouts) no dispara', () => {
    expect(shouldRunStartupSync(false, 0)).toBe(false)
  })

  it('dispara con el onboarding completado', () => {
    expect(shouldRunStartupSync(true, 0)).toBe(true)
  })

  it('dispara aunque done sea false si ya hay workouts (el wizard ya no aplica)', () => {
    expect(shouldRunStartupSync(false, 2)).toBe(true)
  })
})
