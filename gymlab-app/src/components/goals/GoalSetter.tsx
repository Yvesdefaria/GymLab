// Objetivos: formulario para establecer y gestionar objetivos e1RM por ejercicio.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Target, Plus, Trash2, Pencil } from 'lucide-react'
import { useGoalStore } from '@/store/goalStore'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'

export const GoalSetter = () => {
  const { t } = useTranslation()
  const { goals, setGoal, removeGoal } = useGoalStore()
  const { exercises } = useExerciseCatalog()
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<number>(0)
  const [target, setTarget] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const goalEntries = Object.entries(goals).map(([id, val]) => ({
    exerciseId: Number(id),
    target: Number(val),
  }))

  const handleSave = () => {
    const tVal = parseFloat(target)
    if (!selectedId || isNaN(tVal) || tVal <= 0) return
    setGoal(selectedId, tVal)
    setSelectedId(0)
    setTarget('')
    setShowForm(false)
    setEditingId(null)
  }

  const startEdit = (exerciseId: number, currentTarget: number) => {
    setEditingId(exerciseId)
    setSelectedId(exerciseId)
    setTarget(String(currentTarget))
    setShowForm(true)
  }

  const getExerciseName = (id: number) =>
    exercises.find((e) => e.id === id)?.name ?? `Ejercicio #${id}`

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
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="mb-2 w-full rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.65rem] text-fg"
          >
            <option value={0}>{t('goalSetter.selectExercise')}</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
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
              <p className="text-[0.55rem] text-muted">{tgt} kg e1RM</p>
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
    </div>
  )
}
