// Hooks que consultan rutinas, sus días e items, enriqueciendo los ejercicios con nombre y slug.
import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { exerciseRepo, routineRepo } from '@/data/repositories'
import { useLiveList } from './useLiveList'
import { selectableDays } from '@/domain/routines'
import type { RoutineDay, RoutineItem, MuscleGroup } from '@/domain/types'
import type { AppLanguage } from '@/domain/onboarding'
import { localizeExercise, localizeMuscleGroup } from '@/i18n/catalog'

// Item de rutina enriquecido con el nombre y slug del ejercicio para mostrarlo en la UI.
export type RoutineItemWithNames = RoutineItem & {
  exerciseName?: string
  exerciseSlug?: string
  exerciseMuscleGroup?: MuscleGroup
}

// Enriquece los items con el nombre y slug localizados de su ejercicio (sin adjuntar el objeto completo).
const enrichItems = async (items: RoutineItem[], lang: AppLanguage): Promise<RoutineItemWithNames[]> => {
  // Una sola consulta por lote en vez de un getById por item; el Map restaura el orden pedido
  // (anyOf no garantiza orden) y replica el manejo de ejercicios ausentes (undefined).
  const exById = new Map(
    (await exerciseRepo.getByIds(items.map((item) => item.exerciseId))).map((ex) => [ex.id, ex])
  )
  return items.map((item) => {
    const ex = exById.get(item.exerciseId)
    return {
      ...item,
      exerciseName: ex ? localizeExercise(ex, lang).name : undefined,
      exerciseSlug: ex?.slug,
      exerciseMuscleGroup: ex?.muscleGroup,
    }
  })
}

// Devuelve todas las rutinas del usuario para el catálogo.
export const useRoutines = () => {
  const routines = useLiveList(() => routineRepo.getAll())
  return { routines }
}

// Devuelve solo los slugs de rutina (p. ej. para sitemaps o navegación).
export const useRoutineSlugs = () => {
  const slugs = useLiveList(() => routineRepo.getAll().then((rs) => rs.map((r) => r.slug)))
  return { slugs }
}

// Devuelve los días de una rutina concreta.
export const useRoutineDays = (routineId: number | null) => {
  const days = useLiveList(() => (routineId ? routineRepo.getDays(routineId) : []), [routineId])
  return { days }
}

// Carga una rutina por slug junto con sus días e items (con datos del ejercicio adjuntos).
export const useRoutineDetail = (slug: string | undefined) => {
  const { i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const routine = useLiveQuery(
    () => (slug ? routineRepo.getBySlug(slug) : undefined),
    [slug]
  )
  const days = useLiveList(() => (routine ? routineRepo.getDays(routine.id) : []), [routine])
  const items = useLiveList(async () => {
    if (days.length === 0) return []
    const result: RoutineItemWithNames[] = []
    for (const day of days) {
      result.push(...(await enrichItems(await routineRepo.getItems(day.id), lang)))
    }
    return result
  }, [days, lang])
  return { routine, days, items }
}

// Grupos musculares únicos en orden de aparición (Set preserva inserción), localizados.
// Fuente única de los chips del día, compartida por useRoutineDay y el selector (F103/T8).
const muscleGroupsOf = (items: RoutineItemWithNames[], lang: AppLanguage): string[] => {
  const set = new Set<string>()
  for (const item of items) {
    if (item.exerciseMuscleGroup) {
      set.add(localizeMuscleGroup(item.exerciseMuscleGroup, lang))
    }
  }
  return Array.from(set)
}

// Consulta única del día de rutina: items enriquecidos y grupos musculares derivados
// (una lectura de getItems más el lote de ejercicios, en vez de dos consultas N+1).
export const useRoutineDay = (dayId: number | null) => {
  const { i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const items = useLiveList(async () => {
    if (!dayId) return []
    return enrichItems(await routineRepo.getItems(dayId), lang)
  }, [dayId, lang])

  const groups = useMemo(() => muscleGroupsOf(items, lang), [items, lang])

  return { groups, items }
}

// Devuelve los grupos musculares únicos que trabaja un día de rutina (como etiquetas).
export const useRoutineDayMuscleGroups = (dayId: number | null) => {
  const { groups } = useRoutineDay(dayId)
  return { groups }
}

// Devuelve los items de un día de rutina con nombre y slug de cada ejercicio.
export const useRoutineDayItems = (dayId: number | null) => {
  const { items } = useRoutineDay(dayId)
  return { items }
}

// Días con ejercicios de una rutina para el selector del home (F99.1 D2), con sus
// grupos musculares ya localizados, y los días crudos para no duplicar getDays.
// F103/T8: los items se leen en un solo lote (antes N awaits secuenciales, el N+1
// del selector) y el día de hoy sale de acá en vez de un getItems propio.
const EMPTY_SELECTABLE_DAYS: { day: RoutineDay; items: RoutineItemWithNames[] }[] = []
const EMPTY_GROUPS_BY_DAY = new Map<number, string[]>()

export const useRoutineDaysWithItems = (routineId: number | null) => {
  const { i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const days = useLiveList(() => (routineId ? routineRepo.getDays(routineId) : []), [routineId])
  const data = useLiveQuery(async () => {
    if (days.length === 0) {
      return { selectableDays: EMPTY_SELECTABLE_DAYS, groupsByDay: EMPTY_GROUPS_BY_DAY }
    }
    // Un solo lote de lecturas en paralelo; el Map alimenta el filtro puro.
    const itemLists = await Promise.all(days.map((day) => routineRepo.getItems(day.id)))
    const itemsByDay = new Map<number, RoutineItem[]>()
    days.forEach((day, index) => itemsByDay.set(day.id, itemLists[index] ?? []))
    const selectable = selectableDays(days, itemsByDay)
    // Solo se enriquecen los días visibles (mismo criterio que antes).
    const selectableWithItems = await Promise.all(
      selectable.map(async (day) => ({
        day,
        items: await enrichItems(itemsByDay.get(day.id) ?? [], lang),
      })),
    )
    const groupsByDay = new Map<number, string[]>()
    for (const { day, items } of selectableWithItems) {
      groupsByDay.set(day.id, muscleGroupsOf(items, lang))
    }
    return { selectableDays: selectableWithItems, groupsByDay }
  }, [days, lang])
  return {
    days,
    selectableDays: data?.selectableDays ?? EMPTY_SELECTABLE_DAYS,
    groupsByDay: data?.groupsByDay ?? EMPTY_GROUPS_BY_DAY,
  }
}
