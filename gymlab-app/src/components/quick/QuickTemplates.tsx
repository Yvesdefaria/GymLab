// Templates de sesión rápida: lista de rutinas pre-armadas + custom del usuario.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Zap, Clock, ChevronRight, Plus, Trash2, X } from 'lucide-react'
import {
  quickTemplates,
  templateCategories,
  type QuickTemplateCategory,
} from '@/domain/quickTemplates'
import { workoutTemplateRepo } from '@/data/repositories'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import type { WorkoutTemplate } from '@/domain/types'
import { prefersReducedMotion } from '@/lib/animations'
import anime from 'animejs'

const categoryColor: Record<QuickTemplateCategory, string> = {
  express: 'border-accent/40 bg-accent/10',
  stretch: 'border-success/40 bg-success/10',
  mobility: 'border-warning/40 bg-warning/10',
}

// Hash simple para generar IDs negativos estables a partir de nombres.
const hashStr = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return h
}

// Plantilla built-in normalizada a WorkoutTemplate.
const builtInTemplates: WorkoutTemplate[] = quickTemplates.map((qt) => ({
  id: -qt.id.charCodeAt(0),
  name: qt.nameKey,
  description: qt.descriptionKey,
  category: qt.category,
  totalMinutes: qt.totalMinutes,
  exercises: qt.exercises.map((e) => ({
    name: e.nameKey,
    description: e.descriptionKey,
    durationSeconds: e.durationSeconds,
  })),
  isBuiltIn: true,
  createdAt: '',
}))

export const QuickTemplates = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const loadRoutineDay = useActiveWorkoutStore((s) => s.loadRoutineDay)
  const [selectedCategory, setSelectedCategory] = useState<QuickTemplateCategory | null>(null)
  const [customTemplates, setCustomTemplates] = useState<WorkoutTemplate[]>([])
  const [showForm, setShowForm] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    workoutTemplateRepo.getAll().then(setCustomTemplates)
  }, [])

  const allTemplates = [...builtInTemplates, ...customTemplates]

  const filtered = selectedCategory
    ? allTemplates.filter((q) => q.category === selectedCategory)
    : allTemplates

  // Inicia sesión libre con los ejercicios del template.
  const startTemplate = useCallback(
    (tpl: WorkoutTemplate) => {
      loadRoutineDay(
        tpl.exercises.map((ex, i) => ({
          exerciseId: -(i + 1) * 1000 - Math.abs(hashStr(ex.name)),
          exerciseName: ex.name,
          sets: [
            {
              id: `tpl-${Date.now()}-${i}`,
              exerciseId: -(i + 1) * 1000 - Math.abs(hashStr(ex.name)),
              exerciseName: ex.name,
              setNumber: 1,
              weightKg: 0,
              reps: 0,
              completed: false,
              durationSeconds: ex.durationSeconds,
            },
          ],
        })),
        0,
        0,
      )
      navigate('/entrenamiento/activo')
    },
    [loadRoutineDay, navigate],
  )

  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion()) return
    anime({
      targets: containerRef.current.children,
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 250,
      delay: anime.stagger(40),
      easing: 'easeOutCubic',
    })
  }, [selectedCategory, customTemplates.length])

  const handleDelete = async (id: number) => {
    await workoutTemplateRepo.delete(id)
    setCustomTemplates((prev) => prev.filter((tpl) => tpl.id !== id))
  }

  const resolveName = (tpl: WorkoutTemplate): string => {
    if (tpl.isBuiltIn) {
      return tpl.name === 'full-body-express'
        ? t('quickTemplates.fullBodyExpress')
        : tpl.name === 'core-express'
          ? t('quickTemplates.coreExpress')
          : tpl.name === 'full-body-stretch'
            ? t('quickTemplates.fullBodyStretch')
            : tpl.name === 'pre-sleep-stretch'
              ? t('quickTemplates.preSleepStretch')
              : t('quickTemplates.jointMobility')
    }
    return tpl.name
  }

  const resolveDesc = (tpl: WorkoutTemplate): string => {
    if (tpl.isBuiltIn) {
      return tpl.name === 'full-body-express'
        ? t('quickTemplates.fullBodyExpressDesc')
        : tpl.name === 'core-express'
          ? t('quickTemplates.coreExpressDesc')
          : tpl.name === 'full-body-stretch'
            ? t('quickTemplates.fullBodyStretchDesc')
            : tpl.name === 'pre-sleep-stretch'
              ? t('quickTemplates.preSleepStretchDesc')
              : t('quickTemplates.jointMobilityDesc')
    }
    return tpl.description
  }

  const resolveCatLabel = (cat: QuickTemplateCategory) =>
    cat === 'express'
      ? t('quickTemplates.categories.express')
      : cat === 'stretch'
        ? t('quickTemplates.categories.stretch')
        : t('quickTemplates.categories.mobility')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="kicker">{t('quickTemplates.title')}</p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-[0.6rem] font-medium text-accent-fg"
        >
          <Plus className="size-3" />
          {t('quickTemplates.new')}
        </button>
      </div>

      {/* Selector de categoría */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`rounded-lg px-2 py-1.5 text-[0.65rem] font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-accent text-accent-fg'
              : 'bg-bg-elevated/50 text-muted hover:bg-bg-elevated'
          }`}
        >
          {t('quickTemplates.all')}
        </button>
        {templateCategories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`rounded-lg px-2 py-1.5 text-[0.65rem] font-medium transition-colors ${
              selectedCategory === cat.key
                ? 'bg-accent text-accent-fg'
                : 'bg-bg-elevated/50 text-muted hover:bg-bg-elevated'
            }`}
          >
            {resolveCatLabel(cat.key)}
          </button>
        ))}
      </div>

      {/* Lista de templates */}
      <div ref={containerRef} className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-xs text-muted">
            {t('quickTemplates.empty')}
          </p>
        )}
        {filtered.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => startTemplate(tpl)}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors active:scale-[0.98] ${categoryColor[tpl.category]}`}
          >
            <Zap className="size-4 shrink-0 text-accent" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-fg">{resolveName(tpl)}</p>
              <p className="mt-0.5 text-[0.6rem] text-muted">{resolveDesc(tpl)}</p>
              <div className="mt-1 flex items-center gap-2 text-[0.55rem] text-muted">
                <Clock className="size-3" />
                <span>{tpl.totalMinutes} min</span>
                <span>·</span>
                <span>
                  {tpl.exercises.length}{' '}
                  {tpl.exercises.length === 1
                    ? t('quickTemplates.exercise')
                    : t('quickTemplates.exercisesLabel')}
                </span>
                {tpl.isBuiltIn && (
                  <span className="rounded bg-accent/20 px-1 text-accent">
                    {t('quickTemplates.builtin')}
                  </span>
                )}
              </div>
            </div>
            {!tpl.isBuiltIn ? (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(tpl.id)
                }}
                className="rounded-lg p-1.5 text-muted transition-colors hover:bg-error/20 hover:text-error"
                aria-label={t('quickTemplates.delete')}
              >
                <Trash2 className="size-3.5" />
              </span>
            ) : (
              <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
            )}
          </button>
        ))}
      </div>

      {/* Modal crear template */}
      {showForm && (
        <TemplateForm
          onClose={() => setShowForm(false)}
          onCreated={(tpl) => {
            setCustomTemplates((prev) => [...prev, tpl])
            setShowForm(false)
          }}
        />
      )}
    </div>
  )
}

// ─── Formulario para crear template custom ────────────────────────────────

const TemplateForm = ({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (tpl: WorkoutTemplate) => void
}) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<QuickTemplateCategory>('express')
  const [totalMinutes, setTotalMinutes] = useState(15)
  const [exercises, setExercises] = useState<
    { name: string; description: string; durationSeconds: number }[]
  >([{ name: '', description: '', durationSeconds: 30 }])

  const addExercise = () =>
    setExercises((prev) => [...prev, { name: '', description: '', durationSeconds: 30 }])

  const updateExercise = (idx: number, field: string, value: string | number) =>
    setExercises((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)),
    )

  const removeExercise = (idx: number) =>
    setExercises((prev) => prev.filter((_, i) => i !== idx))

  const save = async () => {
    if (!name.trim()) return
    const id = await workoutTemplateRepo.create({
      name: name.trim(),
      description: description.trim(),
      category,
      totalMinutes,
      exercises: exercises.filter((e) => e.name.trim()),
      isBuiltIn: false,
    })
    onCreated({
      id,
      name: name.trim(),
      description: description.trim(),
      category,
      totalMinutes,
      exercises: exercises.filter((e) => e.name.trim()),
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-bg p-4 sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-fg">{t('quickTemplates.newTitle')}</p>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:text-fg">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          <input
            type="text"
            placeholder={t('quickTemplates.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-fg"
          />
          <input
            type="text"
            placeholder={t('quickTemplates.descPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs text-fg"
          />

          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as QuickTemplateCategory)}
              className="flex-1 rounded-lg border border-border bg-bg-elevated px-2 py-2 text-xs text-fg"
            >
              <option value="express">{t('quickTemplates.categories.express')}</option>
              <option value="stretch">{t('quickTemplates.categories.stretch')}</option>
              <option value="mobility">{t('quickTemplates.categories.mobility')}</option>
            </select>
            <input
              type="number"
              min={5}
              max={60}
              value={totalMinutes}
              onChange={(e) => setTotalMinutes(Number(e.target.value))}
              className="w-16 rounded-lg border border-border bg-bg-elevated px-2 py-2 text-xs text-fg"
              placeholder="min"
            />
          </div>

          <p className="text-[0.6rem] font-medium text-muted">{t('quickTemplates.exerciseList')}</p>
          {exercises.map((ex, idx) => (
            <div key={idx} className="flex gap-1.5">
              <input
                type="text"
                placeholder={t('quickTemplates.exerciseName')}
                value={ex.name}
                onChange={(e) => updateExercise(idx, 'name', e.target.value)}
                className="flex-1 rounded-lg border border-border bg-bg-elevated px-2 py-1.5 text-[0.65rem] text-fg"
              />
              <input
                type="number"
                min={10}
                max={120}
                value={ex.durationSeconds}
                onChange={(e) => updateExercise(idx, 'durationSeconds', Number(e.target.value))}
                className="w-14 rounded-lg border border-border bg-bg-elevated px-1.5 py-1.5 text-[0.65rem] text-fg"
                placeholder="s"
              />
              {exercises.length > 1 && (
                <button
                  onClick={() => removeExercise(idx)}
                  className="rounded-lg p-1 text-muted hover:text-error"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addExercise}
            className="rounded-lg border border-dashed border-border py-1.5 text-[0.6rem] text-muted hover:border-accent hover:text-accent"
          >
            + {t('quickTemplates.addExercise')}
          </button>

          <button
            onClick={save}
            disabled={!name.trim()}
            className="mt-1 rounded-xl bg-accent py-2.5 text-xs font-semibold text-accent-fg transition-opacity disabled:opacity-40"
          >
            {t('quickTemplates.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
