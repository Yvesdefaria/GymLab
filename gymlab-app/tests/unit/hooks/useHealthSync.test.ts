// Convención del repo: se testea la lógica pura exportada del hook
// (ver useExerciseCatalog.test.ts → filterExercises); el glue React se
// cubre con la regresión e2e de /pasos.
import { describe, expect, it } from 'vitest'
import { mapSyncStatus } from '@/hooks/useHealthSync'

describe('mapSyncStatus', () => {
  it('synced → granted (la UI deja de mostrar el banner)', () => {
    expect(mapSyncStatus('synced')).toBe('granted')
  })

  it('denied → denied (pide conectar salud)', () => {
    expect(mapSyncStatus('denied')).toBe('denied')
  })

  it('unavailable → unavailable (web/no compatible; banner silencioso)', () => {
    expect(mapSyncStatus('unavailable')).toBe('unavailable')
  })

  it('error → error (banner con reintentar)', () => {
    expect(mapSyncStatus('error')).toBe('error')
  })
})