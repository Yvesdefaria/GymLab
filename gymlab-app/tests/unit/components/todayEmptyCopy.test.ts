// F136.2 — el vacío del detalle por hora debe explicar la causa real, no asumir alta manual.
import { describe, expect, it } from 'vitest'
import { todayEmptyTextKey } from '@/components/steps/todayEmptyCopy'

describe('todayEmptyTextKey (F136.2)', () => {
  it('manual sin salud conectada → copy de alta manual con invitación a conectar', () => {
    expect(todayEmptyTextKey('manual', false)).toBe('todayEmptyText')
  })

  it('manual con salud conectada → solo el límite del alta manual', () => {
    expect(todayEmptyTextKey('manual', true)).toBe('todayEmptyManualText')
  })

  it('phone/watch sin salud conectada → invita a conectar', () => {
    expect(todayEmptyTextKey('phone', false)).toBe('todayEmptyHealthText')
    expect(todayEmptyTextKey('watch', false)).toBe('todayEmptyHealthText')
  })

  it('phone/watch con salud conectada → error honesto de lectura', () => {
    expect(todayEmptyTextKey('phone', true)).toBe('todayEmptyErrorText')
    expect(todayEmptyTextKey('watch', true)).toBe('todayEmptyErrorText')
  })

  it('sin fuente → texto neutro', () => {
    expect(todayEmptyTextKey(undefined, false)).toBe('todayEmptyNeutralText')
    expect(todayEmptyTextKey(null, true)).toBe('todayEmptyNeutralText')
  })
})
