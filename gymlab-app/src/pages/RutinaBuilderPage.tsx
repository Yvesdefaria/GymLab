// Página /rutinas/nueva y /rutinas/:slug/editar: editor de rutinas propias (borrador en memoria).
// Permite montar días y ejercicios y guarda/actualiza la rutina en Dexie al confirmar.
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { routineRepo, exerciseRepo } from '@/data/repositories'
import { useRoutineSlugs } from '@/hooks/useRoutines'
import type { RoutineDraft } from '@/data/repositories/types'
import type { Objective, Level, Exercise } from '@/domain/types'
import { LEVELS, OBJECTIVES } from '@/domain/catalog'
import { slugify, TARGET_BOUNDS } from '@/domain/routines'
import { clamp } from '@/domain/numberGuard'
import { localizeObjective, localizeLevel, localizeExercise } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'

// Input numérico con draft local: permite dejar el campo vacío mientras se teclea
// (sin revertir a 1 al borrar) y valida/ajusta al mínimo en blur.
const TargetInput = ({
  id,
  value,
  bounds,
  label,
  onChange,
}: {
  id: string
  value: number
  bounds: [number, number]
  label: string
  onChange: (value: number) => void
}) => {
  const [draft, setDraft] = useState(String(value))

  // Sincroniza el draft cuando el valor cambia desde fuera (p. ej. tras blur).
  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = () => {
    const n = Number(draft)
    onChange(clamp(Number.isFinite(n) ? n : bounds[0], bounds[0], bounds[1]))
  }

  return (
    <div>
      <label htmlFor={id} className="mb-0.5 block text-[0.65rem] uppercase text-muted">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={bounds[0]}
        max={bounds[1]}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        className="h-11 w-full rounded-lg border border-border bg-bg px-2 text-sm text-fg focus:border-cta focus:outline-none"
      />
    </div>
  )
}

// Representación en memoria de un ejercicio dentro de un día de la rutina.
type DraftItem = {
  exerciseId: number
  exerciseName: string
  targetSets: number
  targetReps: number
  restSec: number
  supersetGroup?: string
}

// Día de la rutina en el borrador: nombre + lista de ejercicios.
type DraftDay = {
  name: string
  items: DraftItem[]
}

export const RutinaBuilderPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { slug } = useParams()
  const navigate = useNavigate()
  // Con slug la página actúa como editor; sin él, como creación.
  const editing = Boolean(slug)

  const [title, setTitle] = useState('')
  const [objective, setObjective] = useState<Objective>('volumen')
  const [level, setLevel] = useState<Level>('principiante')
  const [description, setDescription] = useState('')
  const [days, setDays] = useState<DraftDay[]>([{ name: 'Día 1', items: [] }])
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
      const draftDays: DraftDay[] = []
      for (const day of rDays) {
        const items = await routineRepo.getItems(day.id)
        const draftItems: DraftItem[] = []
        for (const item of items) {
          const ex = await exerciseRepo.getById(item.exerciseId)
          draftItems.push({
            exerciseId: item.exerciseId,
            exerciseName: ex ? localizeExercise(ex, lang).name : `Ejercicio ${item.exerciseId}`,
            targetSets: item.targetSets,
            targetReps: item.targetReps,
            restSec: item.restSec,
            supersetGroup: item.supersetGroup,
          })
        }
        draftDays.push({ name: day.name, items: draftItems })
      }
      if (!cancelled) setDays(draftDays)
    }
    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- los días se reconstruyen desde Dexie (ES), solo al entrar en modo edición.
  }, [slug])

  const { slugs: allSlugs } = useRoutineSlugs()

  const addDay = () => {
    setDays((prev) => [...prev, { name: `Día ${prev.length + 1}`, items: [] }])
  }

  // Impide quedarse sin ningún día: no borra el último.
  const removeDay = (index: number) => {
    setDays((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const updateDayName = (index: number, name: string) => {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, name } : d)))
  }

  // Añade un ejercicio al día con valores por defecto de series, reps y descanso.
  const addItemToDay = (dayIndex: number, exercise: Exercise) => {
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
  }

  // Aplica un cambio parcial (series/reps/descanso/superserie) a un ejercicio concreto.
  const updateItem = (dayIndex: number, itemIndex: number, patch: Partial<DraftItem>) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex
          ? { ...d, items: d.items.map((it, j) => (j === itemIndex ? { ...it, ...patch } : it)) }
          : d
      )
    )
  }

  const removeItem = (dayIndex: number, itemIndex: number) => {
    setDays((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, items: d.items.filter((_, j) => j !== itemIndex) } : d))
    )
  }

  // Guarda o actualiza la rutina: genera slug único, monta el draft y navega al detalle.
  const handleSave = async () => {
    if (!title.trim() || days.length === 0) return
    setSaving(true)
    let finalSlug = slugify(title)
    // Evita colisionar con otro slug existente añadiendo un sufijo numérico.
    const taken = allSlugs.filter((s) => s !== existing?.slug)
    let n = 2
    while (taken.includes(finalSlug)) finalSlug = `${slugify(title)}-${n++}`

    const draft: RoutineDraft = {
      slug: finalSlug,
      title: title.trim(),
      objective,
      level,
      description: description.trim(),
      days: days.map((d, di) => ({
        name: d.name.trim() || `Día ${di + 1}`,
        items: d.items.map((it, i) => ({
          exerciseId: it.exerciseId,
          targetSets: it.targetSets,
          targetReps: it.targetReps,
          restSec: it.restSec,
          order: i + 1,
          supersetGroup: it.supersetGroup,
        })),
      })),
    }

    if (existing) await routineRepo.updateRoutine(existing.id, draft)
    else await routineRepo.createRoutine(draft)
    setSaving(false)
    navigate(`/rutinas/${finalSlug}`)
  }

  if (notFound) {
    return (
      <div>
        <AppHeader title={t('rutinas.tituloSingular')} />
        <div className="p-4">
          <BackLink to="/rutinas" />
          <div className="mt-4 panel rounded-2xl p-5 text-center">
            <p className="text-sm text-muted">{t('rutinas.builder.soloPropias')}</p>
          </div>
        </div>
      </div>
    )
  }

  const inputClass =
    'h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none'

  return (
    <div>
      <AppHeader
        title={editing ? t('rutinas.builder.tituloEditar') : t('rutinas.builder.tituloNueva')}
        subtitle={t('rutinas.builder.subtitulo')}
      />
      <div className="space-y-4 p-4 pb-32">
        <BackLink to="/rutinas" label={t('rutinas.titulo')} />

        <section className="panel rounded-2xl p-4">
          <label htmlFor="rb-title" className="mb-1 block kicker">{t('rutinas.builder.nombre')}</label>
          <input
            id="rb-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('rutinas.builder.nombrePlaceholder')}
            className={inputClass}
          />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rb-objective" className="mb-1 block kicker">{t('rutinas.builder.objetivo')}</label>
              <select id="rb-objective" value={objective} onChange={(e) => setObjective(e.target.value as Objective)} className={inputClass}>
                {OBJECTIVES.map((o) => (
                  <option key={o} value={o}>
                    {localizeObjective(o, lang)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rb-level" className="mb-1 block kicker">{t('rutinas.builder.nivel')}</label>
              <select id="rb-level" value={level} onChange={(e) => setLevel(e.target.value as Level)} className={inputClass}>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {localizeLevel(l, lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label htmlFor="rb-description" className="mb-1 mt-3 block text-xs font-semibold uppercase tracking-wider text-muted">{t('rutinas.builder.descripcion')}</label>
          <textarea
            id="rb-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('rutinas.builder.descripcionPlaceholder')}
            rows={2}
            className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
          />
        </section>

        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-accent">{t('rutinas.builder.dias', { count: days.length })}</h2>
          <button
            type="button"
            onClick={addDay}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-cta bg-cta/15 px-3 text-sm font-medium text-accent-soft"
          >
            <Plus className="size-4" /> {t('rutinas.builder.anadirDia')}
          </button>
        </div>

        {days.map((day, dayIndex) => (
          <section key={dayIndex} className="panel rounded-2xl p-4">
            <div className="mb-3 flex items-center gap-2">
              <label htmlFor={`day-name-${dayIndex}`} className="sr-only">
                {t('rutinas.builder.nombreDia')}
              </label>
              <input
                id={`day-name-${dayIndex}`}
                type="text"
                value={day.name}
                onChange={(e) => updateDayName(dayIndex, e.target.value)}
                className="h-11 flex-1 rounded-xl border border-border bg-bg px-3 text-sm font-medium text-fg focus:border-cta focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeDay(dayIndex)}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-danger"
                aria-label={t('rutinas.builder.eliminarDia')}
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <div className="space-y-2">
              {day.items.map((item, itemIndex) => (
                <div key={itemIndex} className="rounded-xl border border-border/60 bg-bg/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{item.exerciseName}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(dayIndex, itemIndex)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-danger"
                      aria-label={t('rutinas.builder.quitarEjercicio')}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(
                      [
                        ['rutinas.builder.series', 'targetSets'],
                        ['rutinas.builder.reps', 'targetReps'],
                        ['rutinas.builder.descanso', 'restSec'],
                      ] as const
                    ).map(([labelKey, key]) => (
                      <TargetInput
                        key={key}
                        id={`target-${dayIndex}-${itemIndex}-${key}`}
                        value={item[key]}
                        bounds={TARGET_BOUNDS[key]}
                        label={t(labelKey)}
                        onChange={(value) => updateItem(dayIndex, itemIndex, { [key]: value })}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <label htmlFor={`superset-${dayIndex}-${itemIndex}`} className="text-[0.65rem] uppercase text-muted">
                      {t('rutinas.builder.superserie')}
                    </label>
                    <select
                      id={`superset-${dayIndex}-${itemIndex}`}
                      value={item.supersetGroup ?? ''}
                      onChange={(e) =>
                        updateItem(dayIndex, itemIndex, { supersetGroup: e.target.value || undefined })
                      }
                      className="h-11 rounded-lg border border-border bg-bg px-2 text-sm text-fg focus:border-cta focus:outline-none"
                    >
                      <option value="">—</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                    <p className="text-[0.65rem] text-muted">
                      {t('rutinas.builder.superserieAyuda')}
                    </p>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setPickingDay(dayIndex)}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gold/50 text-sm text-accent-soft"
              >
                <Plus className="size-4" /> {t('rutinas.builder.anadirEjercicio')}
              </button>
            </div>
          </section>
        ))}

        <Button
          size="lg"
          className="w-full"
          onClick={handleSave}
          disabled={saving || !title.trim() || days.length === 0}
        >
          {saving ? t('rutinas.guardando') : editing ? t('rutinas.builder.guardarCambios') : t('rutinas.builder.crearRutina')}
        </Button>
      </div>

      {pickingDay !== null ? (
        <ExercisePicker
          onSelect={(ex) => {
            addItemToDay(pickingDay, ex)
            setPickingDay(null)
          }}
          onClose={() => setPickingDay(null)}
        />
      ) : null}
    </div>
  )
}
