import { describe, expect, it } from 'vitest'
import { isPermissionGranted } from '@/data/healthBridge'

describe('isPermissionGranted', () => {
  // Regresión del bug de /pasos: el plugin devuelve un MAPA y el código hacía `.some()`
  // sobre él -> `TypeError: .some is not a function` -> el sync fallaba al 100% con
  // «Could not sync steps», incluso con el permiso ya concedido.
  it('acepta la forma REAL del plugin (un mapa)', () => {
    expect(isPermissionGranted({ READ_STEPS: true }, 'READ_STEPS')).toBe(true)
    expect(isPermissionGranted({ READ_STEPS: false }, 'READ_STEPS')).toBe(false)
  })

  it('sigue aceptando la forma que documenta el README (array de mapas)', () => {
    expect(isPermissionGranted([{ READ_STEPS: true }], 'READ_STEPS')).toBe(true)
    expect(isPermissionGranted([{ READ_STEPS: false }], 'READ_STEPS')).toBe(false)
    expect(isPermissionGranted([{ OTRO: true }, { READ_STEPS: true }], 'READ_STEPS')).toBe(true)
  })

  it('no explota con entradas inesperadas', () => {
    expect(isPermissionGranted(undefined, 'READ_STEPS')).toBe(false)
    expect(isPermissionGranted(null, 'READ_STEPS')).toBe(false)
    expect(isPermissionGranted('nope', 'READ_STEPS')).toBe(false)
    expect(isPermissionGranted(42, 'READ_STEPS')).toBe(false)
    expect(isPermissionGranted([], 'READ_STEPS')).toBe(false)
    expect(isPermissionGranted([null, undefined], 'READ_STEPS')).toBe(false)
    expect(isPermissionGranted({}, 'READ_STEPS')).toBe(false)
  })
})
