// Persistencia del plan del planificador: traduce el `RoutinePlan` del dominio al
// `RoutineDraft` del repo y encapsula el guardado para que un fallo de escritura
// nunca se convierta en un rechazo sin manejar (R3-001).
import type { RoutinePlan } from '@/domain/routineResolution'
import type { RoutineDraft, RoutineRepository } from './repositories/types'

export type PersistPlanResult = { ok: true; slug: string } | { ok: false; error: unknown }

export const planToRoutineDraft = (plan: RoutinePlan, overrides: { slug: string; description?: string }): RoutineDraft => ({
  slug: overrides.slug,
  title: plan.title,
  objective: plan.objective,
  level: plan.level,
  description: overrides.description ?? '',
  basedOnId: plan.basedOnId,
  days: plan.days.map((day) => ({
    name: day.name,
    items: day.items.map((item, index) => ({
      exerciseId: item.exerciseId,
      targetSets: item.targetSets,
      targetReps: item.targetReps,
      restSec: item.restSec,
      order: index + 1,
    })),
  })),
})

// R3-001: un fallo de escritura no puede convertirse en un rechazo sin manejar.
export const persistPlanAsRoutine = async (
  repo: Pick<RoutineRepository, 'createRoutine'>,
  draft: RoutineDraft,
): Promise<PersistPlanResult> => {
  try {
    await repo.createRoutine(draft)
    return { ok: true, slug: draft.slug }
  } catch (error) {
    return { ok: false, error }
  }
}
