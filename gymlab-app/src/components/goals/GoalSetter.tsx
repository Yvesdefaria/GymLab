// Objetivos: formulario para establecer y gestionar objetivos e1RM por ejercicio.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Target, Plus, Trash2, Pencil, Search } from 'lucide-react'
import { useGoalStore } from '@/store/goalStore'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits, parseWeightToKg } from '@/domain/settings'
import { ExercisePicker } from '@/components/workout/ExercisePicker'

export const GoalSetter = () => {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const units = settings.units
  const unitLabel = formatUnits(units)
  const goals = useGoalStore((s) => s.goals)
  const setGoal = useGoalStore((s) => s.setGoal)
  const removeGoal = useGoalStore((s) => s.removeGoal)
  const { exercises } = useExerciseCatalog()
  const [showForm, setShowForm] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedId, setSelectedId] = useState<number>(0)
  const [target, setTarget] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const goalEntries = Object.entries(goals).map(([id, val]) => ({
    exerciseId: Number(id),
    target: Number(val),
  }))

  const handleSave = () => {
    const raw = parseFloat(target)
    if (!selectedId || isNaN(raw) || raw <= 0) return
    // El objetivo se guarda siempre en kg internos; el input va en la unidad del usuario.
    setGoal(selectedId, parseWeightToKg(raw, units))
    setSelectedId(0)
    setTarget('')
    setShowForm(false)
    setEditingId(null)
  }

  const startEdit = (exerciseId: number, currentTarget: number) => {
    setEditingId(exerciseId)
    setSelectedId(exerciseId)
    setTarget(String(Math.round(applyUnits(currentTarget, units) * 10) / 10))
    setShowForm(true)
  }

  const getExerciseName = (id: number) =>
    exercises.find((e) => e.id === id)?.name ?? `Ejercicio #${id}`

  // Muestra el objetivo en la unidad del usuario sin ceros de cola.
  const fmtGoal = (kg: number) => {
    const v = Math.round(applyUnits(kg, units) * 10) / 10
    return Number.isInteger(v) ? String(v) : v.toFixed(1)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-accent" aria-hidden />
          <p className="text-xs font-semibold text-fg">{t('goalSetter.title')}</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setSelectedId(0); setTarget('') }}
          className="flex items-center gap-1 rounded-lg bg-accent/10 px-2 py-1 text-[0.6rem] font-medium text-accent"
        >
          <Plus className="size-3" /> {t('goalSetter.add')}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="rounded-xl border border-border/30 bg-bg-elevated/30 p-3">
          <p className="mb-2 text-[0.65rem] font-semibold text-fg">
            {editingId ? t('goalSetter.edit') : t('goalSetter.new')}
          </p>
          {/* Selector con buscador: reutiliza el ExercisePicker de la sesión (búsqueda + favoritos + virtualizado). */}
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            aria-haspopup="dialog"
            className="mb-2 flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.65rem] text-fg"
          >
            <span className="truncate">
              {selectedId ? getExerciseName(selectedId) : t('goalSetter.selectExercise')}
            </span>
            <Search className="size-3.5 shrink-0 text-muted" aria-hidden />
          </button>
          <input
            type="number"
            placeholder={t('goalSetter.targetPlaceholder')}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mb-2 w-full rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.65rem] text-fg"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setEditingId(null) }}
              className="flex-1 rounded-lg bg-bg-elevated/50 px-2 py-1.5 text-[0.6rem] text-muted"
            >
              {t('goalSetter.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-accent px-2 py-1.5 text-[0.6rem] font-medium text-accent-fg"
            >
              {t('goalSetter.save')}
            </button>
          </div>
        </div>
      )}

      {/* Lista de objetivos */}
      {goalEntries.length === 0 ? (
        <p className="text-[0.6rem] text-muted">{t('goalSetter.none')}</p>
      ) : (
        goalEntries.map(({ exerciseId, target: tgt }) => (
          <div
            key={exerciseId}
            className="flex items-center gap-2 rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2"
          >
            <Target className="size-3.5 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[0.6rem] font-medium text-fg truncate">{getExerciseName(exerciseId)}</p>
              <p className="text-[0.55rem] text-muted">{fmtGoal(tgt)} {unitLabel} e1RM</p>
            </div>
            <button onClick={() => startEdit(exerciseId, tgt)} className="text-muted hover:text-accent">
              <Pencil className="size-3" />
            </button>
            <button onClick={() => removeGoal(exerciseId)} className="text-muted hover:text-red-400">
              <Trash2 className="size-3" />
            </button>
          </div>
        ))
      )}

      {showPicker && (
        <ExercisePicker
          onSelect={(ex) => { setSelectedId(ex.id); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
