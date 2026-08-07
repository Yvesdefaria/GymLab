import { useLiveQuery } from 'dexie-react-hooks'
import { exerciseRepo, routineRepo } from '@/data/repositories'
import type { RoutineItem } from '@/domain/types'
import { MUSCLE_GROUP_LABELS } from '@/domain/routines'

export type RoutineItemWithNames = RoutineItem & {
  exerciseName?: string
  exerciseSlug?: string
}

export const useRoutines = () => {
  const routines = useLiveQuery(() => routineRepo.getAll(), []) ?? []
  return { routines }
}

export const useRoutineSlugs = () => {
  const slugs = useLiveQuery(() => routineRepo.getAll().then((rs) => rs.map((r) => r.slug)), []) ?? []
  return { slugs }
}

export const useRoutineDays = (routineId: number | null) => {
  const days = useLiveQuery(
    () => (routineId ? routineRepo.getDays(routineId) : []),
    [routineId]
  ) ?? []
  return { days }
}

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
