// Tests del alta desde catálogo (F98.3): decisión de destino (sesión activa vs
// selector de rutina) y borrador del ítem con defaults. Convención del repo: se
// testea la lógica pura exportada del hook; el glue React/IndexedDB se cubre con
// el build y la e2e.
import { describe, expect, it } from 'vitest'
import {
  buildRoutineItemDraft,
  catalogAddDestination,
  CATALOG_ADD_DEFAULTS,
} from '@/hooks/useCatalogAdd'

describe('catalogAddDestination', () => {
  it('con sesión activa (startedAt no nulo) enruta al alta directa en sesión', () => {
    expect(catalogAddDestination('2026-09-14T10:00:00.000Z')).toBe('session')
  })

  it('sin sesión activa abre el selector de rutina como destino', () => {
    expect(catalogAddDestination(null)).toBe('routine')
  })
})

describe('buildRoutineItemDraft', () => {
  it('construye el borrador con los defaults de series, reps y descanso', () => {
    expect(buildRoutineItemDraft(42)).toEqual({
      exerciseId: 42,
      targetSets: CATALOG_ADD_DEFAULTS.targetSets,
      targetReps: CATALOG_ADD_DEFAULTS.targetReps,
      restSec: CATALOG_ADD_DEFAULTS.restSec,
    })
  })

  it('los defaults del alta desde catálogo son 3×10 con 90 s de descanso', () => {
    expect(CATALOG_ADD_DEFAULTS).toEqual({ targetSets: 3, targetReps: 10, restSec: 90 })
  })
})
