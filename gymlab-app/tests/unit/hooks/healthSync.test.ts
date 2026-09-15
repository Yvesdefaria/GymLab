import { describe, expect, it } from 'vitest'
import {
  mapSyncStatus,
  shouldResyncOnForeground,
  type HealthSyncStatus,
} from '@/hooks/useHealthSync'

describe('mapSyncStatus', () => {
  it('mapea synced a granted', () => {
    expect(mapSyncStatus('synced')).toBe('granted')
  })

  it('deja pasar el resto de estados del sync sin cambios', () => {
    for (const s of ['unavailable', 'denied', 'error'] as const) {
      expect(mapSyncStatus(s)).toBe(s)
    }
  })
})

describe('shouldResyncOnForeground', () => {
  // Regresión del loop de /pasos: re-PEDIR permiso al volver al primer plano abre la
  // activity de Health Connect y, al volver, dispara otro appStateChange, realimentando
  // el ciclo (medido en emulador: 70 eventos y 141 requests en ~9 s).
  it('NO re-sincroniza si el permiso está denegado', () => {
    expect(shouldResyncOnForeground('denied')).toBe(false)
  })

  it('NO re-sincroniza en idle, sincronizando, sin disponibilidad o con error', () => {
    for (const s of ['idle', 'syncing', 'unavailable', 'error'] as HealthSyncStatus[]) {
      expect(shouldResyncOnForeground(s)).toBe(false)
    }
  })

  it('sí re-sincroniza cuando el permiso ya está concedido', () => {
    expect(shouldResyncOnForeground('granted')).toBe(true)
  })
})
