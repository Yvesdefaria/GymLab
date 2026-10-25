// Objetivos (/objetivos): héroe «próximo hito», una fila por objetivo del
// store y alta/edición en bottom sheet (F132.4). El picker se abre con el
// sheet desmontado para no quedar debajo por z-index.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { GoalHero } from '@/components/goals/GoalHero'
import { GoalRow } from '@/components/goals/GoalRow'
import { GoalSheet } from '@/components/goals/GoalSheet'
import { ExercisePicker } from '@/components/workout/ExercisePicker'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useAchievementsData } from '@/hooks/useAchievementsData'
import { useSettings } from '@/hooks/useSettings'
import { useGoalStore } from '@/store/goalStore'
import {
  buildGoalProjections,
  buildGoalRows,
  isEveryGoalReached,
  pickFeaturedGoal,
} from '@/domain/goalProjection'
import { applyUnits, parseWeightToKg } from '@/domain/settings'

interface Draft {
  mode: 'create' | 'edit'
  exerciseId: number
  target: number | undefined
}

export const ObjetivosPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { settings } = useSettings()
  const units = settings.units
  const { exercises } = useExerciseCatalog()
  const { completedSets } = useAchievementsData()
  const goals = useGoalStore((s) => s.goals)
  const setGoal = useGoalStore((s) => s.setGoal)
  const removeGoal = useGoalStore((s) => s.removeGoal)

  const [draft, setDraft] = useState<Draft | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const projections = useMemo(
    () => buildGoalProjections(completedSets, exercises, goals),
    [completedSets, exercises, goals]
  )
  const rows = useMemo(
    () => buildGoalRows(goals, projections, exercises),
    [goals, projections, exercises]
  )
  const featured = useMemo(() => pickFeaturedGoal(projections), [projections])
  const allReached = useMemo(() => isEveryGoalReached(goals, projections), [goals, projections])
  const draftExercise = draft ? exercises.find((e) => e.id === draft.exerciseId) ?? null : null

  const openCreate = () => setDraft({ mode: 'create', exerciseId: 0, target: undefined })
  const openEdit = (exerciseId: number, targetE1rm: number) =>
    setDraft({
      mode: 'edit',
      exerciseId,
      target: Math.round(applyUnits(targetE1rm, units) * 10) / 10,
    })

  const save = () => {
    if (!draft || !draft.exerciseId || draft.target === undefined || draft.target <= 0) return
    setGoal(draft.exerciseId, parseWeightToKg(draft.target, units))
    setDraft(null)
  }

  const remove = () => {
    if (!draft) return
    removeGoal(draft.exerciseId)
    setDraft(null)
  }

  return (
    <div>
      <AppHeader
        title={t('goals.title')}
        actions={
          <button
            type="button"
            onClick={openCreate}
            aria-label={t('goalSetter.add')}
            className="flex size-11 items-center justify-center rounded-full border border-cta/50 text-accent-soft"
          >
            <Plus className="size-5" aria-hidden />
          </button>
        }
      />
      <div className="px-4 pb-20 pt-2">
        <BackLink to="/" />

        <GoalHero
          goalsCount={rows.length}
          featured={featured}
          allReached={allReached}
          units={units}
          onAdd={openCreate}
        />

        {rows.length > 0 && (
          <section className="mt-4">
            <div className="flex items-baseline justify-between border-t border-border/40 pt-2">
              <h2 className="kicker">{t('goals.rows.title', { count: rows.length })}</h2>
            </div>
            <div>
              {rows.map((row) => (
                <GoalRow
                  key={row.exerciseId}
                  row={row}
                  units={units}
                  onEdit={() => openEdit(row.exerciseId, row.targetE1rm)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {draft && !pickerOpen && (
        <GoalSheet
          mode={draft.mode}
          exercise={draftExercise}
          target={draft.target}
          units={units}
          onTargetChange={(target) => setDraft((d) => (d ? { ...d, target } : d))}
          onOpenPicker={() => setPickerOpen(true)}
          onSave={save}
          onDelete={draft.mode === 'edit' ? remove : undefined}
          onClose={() => setDraft(null)}
        />
      )}

      {pickerOpen && (
        <ExercisePicker
          onInspect={(ex) => {
            setPickerOpen(false)
            void navigate(`/ejercicios/${ex.slug}`)
          }}
          onAdd={(ex) => {
            setDraft((d) => (d ? { ...d, exerciseId: ex.id } : d))
            setPickerOpen(false)
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
