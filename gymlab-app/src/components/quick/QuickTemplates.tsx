// Plantillas de sesión rápida en filas hairline: chips de categoría + arranque directo.
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Clock, Zap } from 'lucide-react'
import {
  quickTemplates,
  templateCategories,
  type QuickTemplate,
  type QuickTemplateCategory,
  type QuickTemplateExercise,
} from '@/domain/quickTemplates'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import type { Exercise } from '@/domain/types'

// Resuelve el nombre real del ejercicio desde el catálogo; fallback al label i18n.
const exerciseLabel = (ex: QuickTemplateExercise, idToName: Map<number, string>, t: TFunction): string =>
  idToName.get(ex.exerciseId) ?? (t(ex.nameKey as any) as string)

export const QuickTemplates = ({ exercises }: { exercises: Exercise[] }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const loadRoutineDay = useActiveWorkoutStore((s) => s.loadRoutineDay)
  const [selectedCategory, setSelectedCategory] = useState<QuickTemplateCategory | null>(null)

  const idToName = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise.name]) satisfies [number, string][]),
    [exercises],
  )

  const filtered = selectedCategory
    ? quickTemplates.filter((template) => template.category === selectedCategory)
    : quickTemplates

  // Inicia una sesión libre con los ejercicios del template (ids reales del catálogo).
  const startTemplate = useCallback(
    (template: QuickTemplate) => {
      loadRoutineDay(
        template.exercises.map((exercise, index) => {
          const resolvedName = exerciseLabel(exercise, idToName, t)
          return {
            exerciseId: exercise.exerciseId,
            exerciseName: resolvedName,
            sets: [
              {
                id: `tpl-${Date.now()}-${index}`,
                exerciseId: exercise.exerciseId,
                exerciseName: resolvedName,
                setNumber: 1,
                weightKg: 0,
                reps: 0,
                completed: false,
                durationSeconds: exercise.durationSeconds,
                isWarmup: false,
              },
            ],
          }
        }),
        0,
        0,
      )
      navigate('/entrenamiento/active')
    },
    [loadRoutineDay, navigate, idToName, t],
  )

  const resolveName = (template: QuickTemplate): string => t(template.nameKey as any) as string
  const resolveDesc = (template: QuickTemplate): string => t(template.descriptionKey as any) as string
  const resolveCatLabel = (category: QuickTemplateCategory) =>
    category === 'express'
      ? t('quickTemplates.categories.express')
      : category === 'stretch'
        ? t('quickTemplates.categories.stretch')
        : t('quickTemplates.categories.mobility')

  return (
    <section className="mt-6 border-t border-border/40 pt-4" data-tour="home-quick-templates">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.19em] text-muted">
        {t('quickTemplates.title')}
      </h2>

      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          aria-pressed={selectedCategory === null}
          className={`min-h-[44px] shrink-0 rounded-full border px-3 text-[9.5px] font-medium transition-colors ${
            selectedCategory === null
              ? 'border-gold/50 bg-gold/10 text-gold-bright'
              : 'border-border/40 text-muted'
          }`}
        >
          {t('quickTemplates.all')}
        </button>
        {templateCategories.map((category) => {
          const active = selectedCategory === category.key
          return (
            <button
              key={category.key}
              type="button"
              onClick={() => setSelectedCategory(category.key)}
              aria-pressed={active}
              className={`min-h-[44px] shrink-0 rounded-full border px-3 text-[9.5px] font-medium transition-colors ${
                active
                  ? 'border-gold/50 bg-gold/10 text-gold-bright'
                  : 'border-border/40 text-muted'
              }`}
            >
              {resolveCatLabel(category.key)}
            </button>
          )
        })}
      </div>

      <div className="mt-1">
        {filtered.length === 0 && (
          <p className="py-4 text-center text-[10px] text-muted">{t('quickTemplates.empty')}</p>
        )}
        {filtered.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => startTemplate(template)}
            className="flex min-h-[56px] w-full items-center gap-3 border-t border-border/40 py-2 text-left"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
              <Zap className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-fg">{resolveName(template)}</span>
              <span className="mt-0.5 block truncate text-[9.5px] text-muted">
                {resolveDesc(template)}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[8.5px] text-muted">
                <Clock className="size-3" aria-hidden="true" />
                {template.totalMinutes} min
                <span aria-hidden="true">·</span>
                {template.exercises.length}{' '}
                {template.exercises.length === 1
                  ? t('quickTemplates.exercise')
                  : t('quickTemplates.exercisesLabel')}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted/60" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  )
}
