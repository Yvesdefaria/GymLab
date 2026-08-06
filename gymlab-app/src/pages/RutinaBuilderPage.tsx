import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppHeader } from '@/components/layout/AppHeader'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { routineRepo, exerciseRepo } from '@/data/repositories'
import type { RoutineDraft } from '@/data/repositories/types'
import type { Objective, Level, Exercise } from '@/domain/types'
import { OBJECTIVE_LABELS, LEVEL_LABELS, slugify } from '@/domain/routines'
import { clamp } from '@/domain/numberGuard'

const objectiveOptions: Objective[] = ['volumen', 'definicion', 'fuerza', 'resistencia', 'general']
const levelOptions: Level[] = ['principiante', 'intermedio', 'avanzado']

const TARGET_BOUNDS: Record<'targetSets' | 'targetReps' | 'restSec', [number, number]> = {
  targetSets: [1, 20],
  targetReps: [1, 100],
  restSec: [1, 600],
}

type DraftItem = {
  exerciseId: number
  exerciseName: string
  targetSets: number
  targetReps: number
  restSec: number
  supersetGroup?: string
}

type DraftDay = {
  name: string
  items: DraftItem[]
}

export const RutinaBuilderPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
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
            exerciseName: ex?.name ?? `Ejercicio ${item.exerciseId}`,
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
  }, [slug])

  const allSlugs = useLiveQuery(() => routineRepo.getAll().then((rs) => rs.map((r) => r.slug)), []) ?? []

  const addDay = () => {
    setDays((prev) => [...prev, { name: `Día ${prev.length + 1}`, items: [] }])
  }

  const removeDay = (index: number) => {
    setDays((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const updateDayName = (index: number, name: string) => {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, name } : d)))
  }

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

  const handleSave = async () => {
    if (!title.trim() || days.length === 0) return
    setSaving(true)
    let finalSlug = slugify(title)
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
        <AppHeader title="Rutina" />
        <div className="p-4">
          <Link to="/rutinas" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft">
            <ArrowLeft className="size-4" /> Volver
          </Link>
          <div className="mt-4 rounded-2xl border border-gold/40 bg-bg-elevated p-5 text-center">
            <p className="text-sm text-muted">Solo puedes editar rutinas propias.</p>
          </div>
        </div>
      </div>
    )
  }

  const inputClass =
    'h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none'

  return (
    <div>
      <AppHeader title={editing ? 'Editar rutina' : 'Nueva rutina'} subtitle="Crea tu propia rutina" />
      <div className="space-y-4 p-4 pb-32">
        <Link to="/rutinas" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft">
          <ArrowLeft className="size-4" /> Rutinas
        </Link>

        <section className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Nombre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Push Pull Legs propio"
            className={inputClass}
          />

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Objetivo</label>
              <select value={objective} onChange={(e) => setObjective(e.target.value as Objective)} className={inputClass}>
                {objectiveOptions.map((o) => (
                  <option key={o} value={o}>
                    {OBJECTIVE_LABELS[o]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Nivel</label>
              <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className={inputClass}>
                {levelOptions.map((l) => (
                  <option key={l} value={l}>
                    {LEVEL_LABELS[l]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="mb-1 mt-3 block text-xs font-semibold uppercase tracking-wider text-muted">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción de la rutina"
            rows={2}
            className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
          />
        </section>

        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-accent">Días ({days.length})</h2>
          <button
            type="button"
            onClick={addDay}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-cta bg-cta/15 px-3 text-sm font-medium text-accent-soft"
          >
            <Plus className="size-4" /> Añadir día
          </button>
        </div>

        {days.map((day, dayIndex) => (
          <section key={dayIndex} className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
            <div className="mb-3 flex items-center gap-2">
              <input
                type="text"
                value={day.name}
                onChange={(e) => updateDayName(dayIndex, e.target.value)}
                className="h-11 flex-1 rounded-xl border border-border bg-bg px-3 text-sm font-medium text-fg focus:border-cta focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeDay(dayIndex)}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-danger"
                aria-label="Eliminar día"
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
                      aria-label="Quitar ejercicio"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(
                      [
                        ['Series', 'targetSets'],
                        ['Reps', 'targetReps'],
                        ['Descanso', 'restSec'],
                      ] as const
                    ).map(([label, key]) => (
                      <div key={key}>
                        <label className="mb-0.5 block text-[0.65rem] uppercase text-muted">{label}</label>
                        <input
                          type="number"
                          min={TARGET_BOUNDS[key][0]}
                          max={TARGET_BOUNDS[key][1]}
                          value={item[key]}
                          onChange={(e) =>
                            updateItem(dayIndex, itemIndex, {
                              [key]: clamp(Number(e.target.value) || 1, ...TARGET_BOUNDS[key]),
                            })
                          }
                          className="h-11 w-full rounded-lg border border-border bg-bg px-2 text-sm text-fg focus:border-cta focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-[0.65rem] uppercase text-muted">Superserie</label>
                    <select
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
                      Mismo grupo = se entrenan seguidas.
                    </p>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setPickingDay(dayIndex)}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gold/50 text-sm text-accent-soft"
              >
                <Plus className="size-4" /> Añadir ejercicio
              </button>
            </div>
          </section>
        ))}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !title.trim() || days.length === 0}
          className="gold-gradient flex min-h-[56px] w-full items-center justify-center rounded-2xl px-4 py-3 font-display text-lg font-semibold tracking-wide text-on-gold shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear rutina'}
        </button>
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
