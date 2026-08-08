// Hooks que consultan rutinas, sus días e items, enriqueciendo los ejercicios con nombre y slug.
import { useLiveQuery } from 'dexie-react-hooks'
import { exerciseRepo, routineRepo } from '@/data/repositories'
import type { RoutineItem } from '@/domain/types'
import { MUSCLE_GROUP_LABELS } from '@/domain/routines'

// Item de rutina enriquecido con el nombre y slug del ejercicio para mostrarlo en la UI.
export type RoutineItemWithNames = RoutineItem & {
  exerciseName?: string
  exerciseSlug?: string
}

// Devuelve todas las rutinas del usuario para el catálogo.
export const useRoutines = () => {
  const routines = useLiveQuery(() => routineRepo.getAll(), []) ?? []
  return { routines }
}

// Devuelve solo los slugs de rutina (p. ej. para sitemaps o navegación).
export const useRoutineSlugs = () => {
  const slugs = useLiveQuery(() => routineRepo.getAll().then((rs) => rs.map((r) => r.slug)), []) ?? []
  return { slugs }
}

// Devuelve los días de una rutina concreta.
export const useRoutineDays = (routineId: number | null) => {
  const days = useLiveQuery(
    () => (routineId ? routineRepo.getDays(routineId) : []),
    [routineId]
  ) ?? []
  return { days }
}

// Carga una rutina por slug junto con sus días e items (con datos del ejercicio adjuntos).
export const useRoutineDetail = (slug: string | undefined) => {
  const routine = useLiveQuery(
    () => (slug ? routineRepo.getBySlug(slug) : undefined),
    [slug]
  )
  const days = useLiveQuery(
    () => (routine ? routineRepo.getDays(routine.id) : []),
    [routine]
  ) ?? []
  const items = useLiveQuery(async () => {
    if (days.length === 0) return []
    const result: RoutineItemWithNames[] = []
    for (const day of days) {
      const dayItems = await routineRepo.getItems(day.id)
      for (const item of dayItems) {
        const ex = await exerciseRepo.getById(item.exerciseId)
        result.push({ ...item, exerciseName: ex?.name, exerciseSlug: ex?.slug })
      }
    }
    return result
  }, [days]) ?? []
  return { routine, days, items }
}

// Devuelve los grupos musculares únicos que trabaja un día de rutina (como etiquetas).
export const useRoutineDayMuscleGroups = (dayId: number | null) => {
  const groups = useLiveQuery(async () => {
    if (!dayId) return []
    const items = await routineRepo.getItems(dayId)
    const set = new Set<string>()
    for (const item of items) {
      const ex = await exerciseRepo.getById(item.exerciseId)
      if (ex) set.add(MUSCLE_GROUP_LABELS[ex.muscleGroup] ?? ex.muscleGroup)
    }
    return Array.from(set)
  }, [dayId]) ?? []
  return { groups }
}

// Devuelve los items de un día de rutina con nombre y slug de cada ejercicio.
export const useRoutineDayItems = (dayId: number | null) => {
  const items = useLiveQuery(async () => {
    if (!dayId) return []
    const dayItems = await routineRepo.getItems(dayId)
    const result: RoutineItemWithNames[] = []
    for (const item of dayItems) {
      const ex = await exerciseRepo.getById(item.exerciseId)
      result.push({ ...item, exerciseName: ex?.name, exerciseSlug: ex?.slug })
    }
    return result
  }, [dayId]) ?? []
  return { items }
}
