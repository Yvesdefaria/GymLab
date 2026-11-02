// Borrador de rutina del builder: valores persistidos (F134/T2), carga en modo
// edición y guardado (crear/actualizar). El borrador vive en un store con `persist`
// para que salir de la pantalla —o que el back de Android la desmonte— no borre el
// trabajo a medias; el storage diferido agrupa las escrituras del tecleo.
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { exerciseRepo, routineRepo } from '@/data/repositories'
import type { RoutineDraft } from '@/data/repositories/types'
import type { Exercise, Level, Objective } from '@/domain/types'
import {
  uniqueSlug,
  routineDraftFrom,
  reorderArray,
  reorderDays as reorderDaysList,
  type RoutineDraftDay,
} from '@/domain/routines'
import { localizeExercise } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'
import { useRoutineSlugs } from '@/hooks/useRoutines'
import {
  routineDraftScopeFor,
  useRoutineDraftStore,
  type PersistedRoutineDraft,
} from '@/store/routineDraftStore'

// Valores editables del borrador (sin scope, id ni marcas internas).
type DraftValues = Pick<
  PersistedRoutineDraft,
  'title' | 'objective' | 'level' | 'description' | 'days'
>

const DEFAULT_VALUES: DraftValues = {
  title: '',
  objective: 'volumen',
  level: 'principiante',
  description: '',
  days: [{ name: 'Día 1', items: [] }],
}

export const useRoutineDraft = (slug?: string) => {
  const { i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const scope = routineDraftScopeFor(slug)

  const storedDraft = useRoutineDraftStore((s) => s.draft)
  const setDraft = useRoutineDraftStore((s) => s.setDraft)
  const clearDraft = useRoutineDraftStore((s) => s.clearDraft)

  // Solo el borrador de este scope se muestra: el de otra rutina queda ignorado.
  const activeDraft = storedDraft?.scope === scope ? storedDraft : null
  const values: DraftValues = activeDraft ?? DEFAULT_VALUES

  // El aviso se decide en el primer render: un borrador sucio que ya existía al
  // entrar. Si se recalculara después, aparecería con la primera tecla.
  const [restored, setRestored] = useState(() => {
    const draft = useRoutineDraftStore.getState().draft
    return draft?.scope === scope && draft.dirty === true
  })

  const [pickingDay, setPickingDay] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [existingId, setExistingId] = useState<number | null>(() => {
    const draft = useRoutineDraftStore.getState().draft
    return draft?.scope === scope ? draft.routineId : null
  })
  const [notFound, setNotFound] = useState(false)

  // Aplica un cambio parcial y sella el borrador como sucio. Lee el estado fresco
  // del store para no pisar cambios con una copia vieja del render.
  const patch = useCallback(
    (next: Partial<DraftValues>) => {
      const current = useRoutineDraftStore.getState().draft
      const base = current?.scope === scope ? current : DEFAULT_VALUES
      setDraft({
        ...base,
        ...next,
        scope,
        routineId: current?.scope === scope ? current.routineId : null,
        dirty: true,
        updatedAt: Date.now(),
      })
    },
    [scope, setDraft]
  )

  // En modo edición carga la rutina propia: solo si el borrador no tiene cambios
  // sin guardar (uno sucio es más nuevo que Dexie y no se pisa).
  const hasPendingChanges = activeDraft?.dirty === true
  useEffect(() => {
    if (!slug || hasPendingChanges) return
    let cancelled = false
    const load = async () => {
      const routine = await routineRepo.getBySlug(slug)
      if (cancelled) return
      if (!routine || !routine.isCustom) {
        setNotFound(true)
        return
      }
      setExistingId(routine.id)
      const rDays = await routineRepo.getDays(routine.id)
      const draftDays: RoutineDraftDay[] = []
      for (const day of rDays) {
        const items = await routineRepo.getItems(day.id)
        // Enriquecimiento por lote (un getByIds por día) en vez de un getById por item;
        // el Map restaura el orden y replica el fallback de ejercicio ausente.
        const exById = new Map(
          (await exerciseRepo.getByIds(items.map((item) => item.exerciseId))).map((ex) => [ex.id, ex])
        )
        const draftItems = items.map((item) => {
          const ex = exById.get(item.exerciseId)
          return {
            exerciseId: item.exerciseId,
            exerciseName: ex ? localizeExercise(ex, lang).name : `Ejercicio ${item.exerciseId}`,
            targetSets: item.targetSets,
            targetReps: item.targetReps,
            restSec: item.restSec,
            supersetGroup: item.supersetGroup,
          }
        })
        draftDays.push({ name: day.name, items: draftItems })
      }
      if (cancelled) return
      setDraft({
        scope,
        title: routine.title,
        objective: routine.objective,
        level: routine.level,
        description: routine.description,
        days: draftDays,
        routineId: routine.id,
        dirty: false,
        updatedAt: Date.now(),
      })
    }
    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recarga desde Dexie solo al entrar o al descartar; un borrador sucio la bloquea.
  }, [slug, hasPendingChanges, lang])

  const { slugs: allSlugs } = useRoutineSlugs()

  const setTitle = (title: string) => patch({ title })
  const setObjective = (objective: Objective) => patch({ objective })
  const setLevel = (level: Level) => patch({ level })
  const setDescription = (description: string) => patch({ description })

  const addDay = () =>
    patch({ days: [...values.days, { name: `Día ${values.days.length + 1}`, items: [] }] })

  // Impide quedarse sin ningún día: no borra el último.
  const removeDay = (index: number) =>
    patch({ days: values.days.length === 1 ? values.days : values.days.filter((_, i) => i !== index) })

  const updateDayName = (index: number, name: string) =>
    patch({ days: values.days.map((d, i) => (i === index ? { ...d, name } : d)) })

  // Añade un ejercicio al día con valores por defecto de series, reps y descanso.
  const addItemToDay = (dayIndex: number, exercise: Exercise) =>
    patch({
      days: values.days.map((d, i) =>
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
      ),
    })

  // Aplica un cambio parcial (series/reps/descanso/superserie) a un ejercicio concreto.
  const updateItem = (
    dayIndex: number,
    itemIndex: number,
    itemPatch: Partial<RoutineDraftDay['items'][number]>
  ) =>
    patch({
      days: values.days.map((d, i) =>
        i === dayIndex
          ? { ...d, items: d.items.map((it, j) => (j === itemIndex ? { ...it, ...itemPatch } : it)) }
          : d
      ),
    })

  const removeItem = (dayIndex: number, itemIndex: number) =>
    patch({
      days: values.days.map((d, i) =>
        i === dayIndex ? { ...d, items: d.items.filter((_, j) => j !== itemIndex) } : d
      ),
    })

  // Aplica el reorden por arrastre dentro de un día.
  const reorderItems = (dayIndex: number, fromIndex: number, toIndex: number) =>
    patch({
      days: values.days.map((d, i) =>
        i === dayIndex ? { ...d, items: reorderArray(d.items, fromIndex, toIndex) } : d
      ),
    })

  // Aplica el reorden por arrastre de días (no-op con lista vacía o un solo día).
  const reorderDays = (fromIndex: number, toIndex: number) =>
    patch({ days: reorderDaysList(values.days, fromIndex, toIndex) })

  // Guarda o actualiza la rutina: slug único + payload y devuelve el slug final.
  const save = useCallback(async (): Promise<string | undefined> => {
    if (!values.title.trim() || values.days.length === 0) return undefined
    setSaving(true)
    let finalSlug: string | undefined
    try {
      // En edición se resuelve la rutina por slug: el borrador restaurado puede no
      // traer el id si se perdió el estado, y crear un duplicado sería peor.
      const target = existingId != null ? { id: existingId, slug } : slug ? await routineRepo.getBySlug(slug) : null
      finalSlug = uniqueSlug(values.title, allSlugs, target?.slug)
      const payload = routineDraftFrom(values)
      const draft: RoutineDraft = {
        slug: finalSlug,
        title: payload.title,
        objective: values.objective,
        level: values.level,
        description: payload.description,
        days: payload.days,
      }
      if (target) await routineRepo.updateRoutine(target.id, draft)
      else await routineRepo.createRoutine(draft)
      // Guardado: el borrador ya no hace falta.
      clearDraft()
    } finally {
      setSaving(false)
    }
    return finalSlug
  }, [values, existingId, slug, allSlugs, clearDraft])

  // Descarta el borrador guardado: en modo nuevo vuelve a los defaults y en edición
  // recarga la rutina guardada (el efecto se reactiva al dejar de haber cambios).
  const discard = () => {
    clearDraft()
    setRestored(false)
  }

  return {
    title: values.title,
    objective: values.objective,
    level: values.level,
    description: values.description,
    days: values.days,
    saving,
    notFound,
    pickingDay,
    restored,
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
    reorderDays,
    setPickingDay,
    save,
    discard,
  }
}
