import { describe, expect, it, vi } from 'vitest'
import { persistPlanAsRoutine, planToRoutineDraft } from '@/data/routinePersistence'
import type { RoutinePlan } from '@/domain/routineResolution'

const PLAN: RoutinePlan = {
  source: 'generated', title: 'Plan volumen · 3 días', objective: 'volumen', level: 'principiante', daysPerWeek: 1,
  days: [{
    dayNumber: 1, name: 'Día 1', estimatedMinutes: 30,
    items: [
      { exerciseId: 1, targetSets: 4, targetReps: 8, restSec: 90 },
      { exerciseId: 2, targetSets: 3, targetReps: 10, restSec: 60 },
    ],
  }],
  coverage: { omittedGroups: [], droppedDays: [] },
}

describe('routinePersistence', () => {
  it('convierte el plan a draft con orden 1..n por día', () => {
    const draft = planToRoutineDraft(PLAN, { slug: 'plan-volumen' })
    expect(draft.slug).toBe('plan-volumen')
    expect(draft.title).toBe('Plan volumen · 3 días')
    expect(draft.days[0].items.map((i) => i.order)).toEqual([1, 2])
    expect(draft.days[0].items[0]).toMatchObject({ exerciseId: 1, targetSets: 4, targetReps: 8, restSec: 90 })
  })

  it('devuelve ok:true con el slug cuando el repo guarda', async () => {
    const repo = { createRoutine: vi.fn().mockResolvedValue(1) }
    const result = await persistPlanAsRoutine(repo, planToRoutineDraft(PLAN, { slug: 'plan-volumen' }))
    expect(result).toEqual({ ok: true, slug: 'plan-volumen' })
  })

  it('devuelve ok:false cuando el repo rechaza (sin rechazo sin manejar)', async () => {
    const repo = { createRoutine: vi.fn().mockRejectedValue(new Error('boom')) }
    const result = await persistPlanAsRoutine(repo, planToRoutineDraft(PLAN, { slug: 'x' }))
    expect(result.ok).toBe(false)
  })
})
