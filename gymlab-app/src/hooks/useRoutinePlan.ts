// Arma el plan de rutina compartido por el planificador y el onboarding (F120/ONB-2):
// lecturas de días/ítems en LOTE (getAllDays/getAllItems, sin fan-out por rutina —
// PLAN-1), equipamiento exigido por rutina en UNA pasada memoizada (PLAN-2) y el
// `planRoutine` resultante. Antes este bloque estaba duplicado textualmente en los
// dos consumidores; acá vive una sola vez.
import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { routineRepo } from '@/data/repositories'
import {
  planRoutine,
  requiredEquipmentByRoutine,
  type PlanRequest,
  type RoutinePlan,
} from '@/domain/routineResolution'
import type { Exercise } from '@/domain/types'
import { useRoutines } from './useRoutines'
import { useExerciseCatalog } from './useExerciseCatalog'

export interface UseRoutinePlanResult {
  // `undefined` mientras los datos/catálogo cargan o el consumidor no habilitó la carga.
  plan: RoutinePlan | undefined
  // Slugs de la MISMA lista de rutinas ya cargada: sin segunda suscripción a `routines`.
  slugs: string[]
  exerciseById: Map<number, Exercise>
}

export const useRoutinePlan = (request: PlanRequest, enabled: boolean): UseRoutinePlanResult => {
  const { routines } = useRoutines()
  const { exercises, loading: catalogLoading } = useExerciseCatalog()

  // Días e ítems de TODAS las rutinas en dos `toArray` (F120/PLAN-1). Se cargan recién
  // con `enabled`: el wizard no los paga antes de generar (planificador) o de llegar
  // al resumen (onboarding). El orden de las filas no influye: el dominio ordena.
  const routineData = useLiveQuery(async () => {
    if (!enabled) return null
    const [days, items] = await Promise.all([routineRepo.getAllDays(), routineRepo.getAllItems()])
    return { days, items }
  }, [enabled])

  const slugs = useMemo(() => routines.map((r) => r.slug), [routines])

  // Catálogo indexado por id: lo usan el equipamiento exigido y las cards del plan.
  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])

  // Equipamiento exigido por cada rutina en una sola pasada (F120/PLAN-2).
  const requiredByRoutineId = useMemo(
    () => (routineData ? requiredEquipmentByRoutine(routineData.days, routineData.items, exerciseById) : new Map()),
    [routineData, exerciseById],
  )

  // El plan se arma una sola vez por combinación de datos/opciones: predefinida si
  // calza, generada si no. El request se rearma acá con campos sueltos en las deps
  // para que la identidad del objeto del consumidor no invalide el memo por render.
  const { level, objective, daysPerWeek, equipment, sessionDurationMin, naming } = request
  const plan = useMemo(() => {
    if (!routineData || catalogLoading) return undefined
    return planRoutine(
      { level, objective, daysPerWeek, equipment, sessionDurationMin, naming },
      routines,
      exercises,
      requiredByRoutineId,
      routineData.days,
      routineData.items,
    )
  }, [
    routineData,
    catalogLoading,
    routines,
    exercises,
    requiredByRoutineId,
    level,
    objective,
    daysPerWeek,
    equipment,
    sessionDurationMin,
    naming,
  ])

  return { plan, slugs, exerciseById }
}
