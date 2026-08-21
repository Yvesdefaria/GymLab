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

// Plantilla built-in normalizada a WorkoutTemplate.
const builtInTemplates: WorkoutTemplate[] = quickTemplates.map((qt, idx) => ({
  id: -(idx + 1),
  name: qt.nameKey,
  description: qt.descriptionKey,
  category: qt.category,
  totalMinutes: qt.totalMinutes,
  exercises: qt.exercises.map((e) => ({
    name: e.nameKey,
    description: e.descriptionKey,
    durationSeconds: e.durationSeconds,
    isWarmup: false,
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
  const [newName, setNewName] = useState('')
  const [showNewInput, setShowNewInput] = useState(false)
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
        tpl.exercises.map((ex, i) => {
          const resolvedName = ex.name.startsWith('quickTemplates.')
            ? t(ex.name)
            : ex.name
          return {
            exerciseId: -(i + 1),
            exerciseName: resolvedName,
            sets: [
              {
                id: `tpl-${Date.now()}-${i}`,
                exerciseId: -(i + 1),
                exerciseName: resolvedName,
                setNumber: 1,
                weightKg: 0,
                reps: 0,
                completed: false,
                durationSeconds: ex.durationSeconds,
                isWarmup: ex.isWarmup,
              },
            ],
          }
        }),
        0,
        0,
      )
      navigate('/entrenamiento/activo')
    },
    [loadRoutineDay, navigate, t],
  )

  // Guarda un template nuevo.
  const handleSaveNew = async () => {
    if (!newName.trim()) return
    const id = await workoutTemplateRepo.create({
      name: newName.trim(),
      description: '',
      category: 'express',
      totalMinutes: 15,
      exercises: [],
      isBuiltIn: false,
    })
    setCustomTemplates((prev) => [
      ...prev,
      {
        id,
        name: newName.trim(),
        description: '',
        category: 'express',
        totalMinutes: 15,
        exercises: [],
        isBuiltIn: false,
        createdAt: new Date().toISOString(),
      },
    ])
    setNewName('')
    setShowNewInput(false)
  }

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

  const resolveName = (tpl: WorkoutTemplate): string =>
    tpl.isBuiltIn ? t(tpl.name) : tpl.name

  const resolveDesc = (tpl: WorkoutTemplate): string =>
    tpl.isBuiltIn ? t(tpl.description) : tpl.description

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
        {!showNewInput && (
          <button
            onClick={() => setShowNewInput(true)}
            className="flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-[0.6rem] font-medium text-accent-fg"
          >
            <Plus className="size-3" />
            {t('quickTemplates.new')}
          </button>
        )}
      </div>

      {showNewInput && (
        <div className="flex gap-1.5">
          <input
            type="text"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveNew()
              if (e.key === 'Escape') { setShowNewInput(false); setNewName('') }
            }}
            placeholder={t('quickTemplates.namePlaceholder')}
            className="flex-1 rounded-lg border border-accent bg-bg-elevated px-3 py-2 text-xs text-fg"
          />
          <button
            onClick={handleSaveNew}
            className="rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-fg"
          >
            {t('quickTemplates.save')}
          </button>
          <button
            onClick={() => { setShowNewInput(false); setNewName('') }}
            className="rounded-lg bg-bg-elevated px-3 py-2 text-xs text-muted"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

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
    </div>
  )
}
