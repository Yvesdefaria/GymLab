// Borrador de rutina del builder: días/ejercicios en memoria, carga en modo edición y guardado (crear/actualizar).
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { exerciseRepo, routineRepo } from '@/data/repositories'
import type { RoutineDraft } from '@/data/repositories/types'
import type { Exercise, Level, Objective } from '@/domain/types'
import { uniqueSlug, routineDraftFrom, reorderArray, type RoutineDraftDay } from '@/domain/routines'
import { localizeExercise } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'
import { useRoutineSlugs } from '@/hooks/useRoutines'

export const useRoutineDraft = (slug?: string) => {
  const { i18n } = useTranslation()
  const lang = i18n.language as AppLanguage

  const [title, setTitle] = useState('')
  const [objective, setObjective] = useState<Objective>('volumen')
  const [level, setLevel] = useState<Level>('principiante')
  const [description, setDescription] = useState('')
  const [days, setDays] = useState<RoutineDraftDay[]>([{ name: 'Día 1', items: [] }])
  const [pickingDay, setPickingDay] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [existing, setExisting] = useState<{ id: number; slug: string } | null>(null)
  const [notFound, setNotFound] = useState(false)

  // En modo edición carga la rutina propia y reconstruye el borrador con sus días y ejercicios.
  useEffect(() => {
    if (!slug) return
    let cancelled = false
    const load = async () => {
      const routine = await routineRepo.getBySlug(slug)
      if (cancelled) return
      if (!routine || !routine.isCustom) {
        setNotFound(true)
        return
      }
      setExisting({ id: routine.id, slug: routine.slug })
      setTitle(routine.title)
      setObjective(routine.objective)
      setLevel(routine.level)
      setDescription(routine.description)
      const rDays = await routineRepo.getDays(routine.id)
      const draftDays: RoutineDraftDay[] = []
      for (const day of rDays) {
        const items = await routineRepo.getItems(day.id)
        const draftItems = await Promise.all(
          items.map(async (item) => {
            const ex = await exerciseRepo.getById(item.exerciseId)
            return {
              exerciseId: item.exerciseId,
              exerciseName: ex ? localizeExercise(ex, lang).name : `Ejercicio ${item.exerciseId}`,
              targetSets: item.targetSets,
              targetReps: item.targetReps,
              restSec: item.restSec,
              supersetGroup: item.supersetGroup,
            }
          })
        )
        draftDays.push({ name: day.name, items: draftItems })
      }
      if (!cancelled) setDays(draftDays)
    }
    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- los días se reconstruyen desde Dexie, solo al entrar en modo edición.
  }, [slug])

  const { slugs: allSlugs } = useRoutineSlugs()

  const addDay = () => setDays((prev) => [...prev, { name: `Día ${prev.length + 1}`, items: [] }])

  // Impide quedarse sin ningún día: no borra el último.
  const removeDay = (index: number) =>
    setDays((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))

  const updateDayName = (index: number, name: string) =>
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, name } : d)))

  // Añade un ejercicio al día con valores por defecto de series, reps y descanso.
  const addItemToDay = (dayIndex: number, exercise: Exercise) =>
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex
          ? {
              ...d,
              items: [
                ...d.items,
                {
                  exerciseId: exercise.id,
                  exerciseName: exercise.name,
                  targetSets: 3,
                  targetReps: 10,
                  restSec: 90,
                },
              ],
            }
          : d
      )
    )

  // Aplica un cambio parcial (series/reps/descanso/superserie) a un ejercicio concreto.
  const updateItem = (dayIndex: number, itemIndex: number, patch: Partial<RoutineDraftDay['items'][number]>) =>
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex
          ? { ...d, items: d.items.map((it, j) => (j === itemIndex ? { ...it, ...patch } : it)) }
          : d
      )
    )

  const removeItem = (dayIndex: number, itemIndex: number) =>
    setDays((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, items: d.items.filter((_, j) => j !== itemIndex) } : d))
    )

  // Aplica el reorden por arrastre dentro de un día.
  const reorderItems = (dayIndex: number, fromIndex: number, toIndex: number) =>
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex ? { ...d, items: reorderArray(d.items, fromIndex, toIndex) } : d
      )
    )

  // Guarda o actualiza la rutina: slug único + payload y devuelve el slug final para navegar al detalle.
  const save = useCallback(async (): Promise<string | undefined> => {
    if (!title.trim() || days.length === 0) return undefined
    setSaving(true)
    let finalSlug: string | undefined
    try {
      finalSlug = uniqueSlug(title, allSlugs, existing?.slug)
      const payload = routineDraftFrom({ title, objective, level, description, days })
      const draft: RoutineDraft = {
        slug: finalSlug,
        title: payload.title,
        objective,
        level,
        description: payload.description,
        days: payload.days,
      }
      if (existing) await routineRepo.updateRoutine(existing.id, draft)
      else await routineRepo.createRoutine(draft)
    } finally {
      setSaving(false)
    }
    return finalSlug
  }, [title, objective, level, description, days, allSlugs, existing])

  return {
    title,
    objective,
    level,
    description,
    days,
    saving,
    notFound,
    pickingDay,
    setTitle,
    setObjective,
    setLevel,
    setDescription,
    addDay,
    removeDay,
    updateDayName,
    addItemToDay,
    updateItem,
    removeItem,
    reorderItems,
    setPickingDay,
    save,
  }
}