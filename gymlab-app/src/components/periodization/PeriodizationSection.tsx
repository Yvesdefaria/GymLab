import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, Sparkles, Plus, Trash2, Check } from 'lucide-react'
import { generateSmartPlan } from '@/domain/autoPeriodization'
import { createEmptyPlan, calculateTotalWeeks, type Mesocycle } from '@/domain/periodization'
import { usePeriodization } from '@/hooks/usePeriodization'
import { useLiveQuery } from 'dexie-react-hooks'
import { workoutRepo, workoutSetRepo, exerciseRepo } from '@/data/repositories'
import { PeriodizationView } from './PeriodizationView'

export const PeriodizationSection = () => {
  const { t } = useTranslation()
  const { plans, activePlan, periodizationRepo } = usePeriodization()
  const [generating, setGenerating] = useState(false)

  const workouts = useLiveQuery(() => workoutRepo.getAll(), []) ?? []
  const sets = useLiveQuery(() => workoutSetRepo.getAll(), []) ?? []
  const exercises = useLiveQuery(() => exerciseRepo.getAll(), []) ?? []

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const plan = generateSmartPlan({ workouts, sets, exercises, startDate: new Date().toISOString(), weeksLabel: t('periodization.weeksShort') })
      const id = await periodizationRepo.create({ name: plan.name, startDate: plan.startDate, mesocycles: plan.mesocycles, isActive: true })
      await periodizationRepo.setActive(id)
    } finally {
      setGenerating(false)
    }
  }

  const handleCreateEmpty = async () => {
    const plan = createEmptyPlan(new Date().toISOString())
    const id = await periodizationRepo.create({ name: plan.name, startDate: plan.startDate, mesocycles: [], isActive: true })
    await periodizationRepo.setActive(id)
  }

  const handleSave = async (mesocycles: Mesocycle[]) => {
    if (!activePlan) return
    await periodizationRepo.update(activePlan.id, {
      mesocycles,
      name: `Plan ${calculateTotalWeeks(mesocycles)} ${t('periodization.weeksShort')}`,
    })
  }

  const handleDelete = async (id: number) => {
    await periodizationRepo.delete(id)
  }

  const handleSetActive = async (id: number) => {
    await periodizationRepo.setActive(id)
  }

  if (activePlan) {
    const planData = {
      id: String(activePlan.id),
      name: activePlan.name,
      mesocycles: activePlan.mesocycles,
      totalWeeks: calculateTotalWeeks(activePlan.mesocycles),
      startDate: activePlan.startDate,
    }
    return (
      <div className="flex flex-col gap-4">
        <PeriodizationView plan={planData} editable onSave={handleSave} />
        {plans.length > 1 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted font-semibold uppercase tracking-wider">{t('periodization.otherPlans')}</p>
            {plans.filter((p) => p.id !== activePlan.id).map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-xl border border-border/15 bg-bg-elevated/20 px-3 py-2.5">
                <button onClick={() => handleSetActive(p.id)} className="flex-1 text-left text-sm text-muted truncate">{p.name}</button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-400/20 min-h-[36px] min-w-[36px] flex items-center justify-center">
                  <Trash2 className="size-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2 rounded-xl border border-border/20 bg-bg-elevated/20 px-3 py-2.5">
        <Calendar className="size-4 text-accent shrink-0 mt-0.5" aria-hidden />
        <p className="text-xs text-muted leading-relaxed">{t('periodization.noActivePlan')}</p>
      </div>
      <button onClick={handleGenerate} disabled={generating} className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg min-h-[48px] disabled:opacity-50">
        <Sparkles className="size-4" /> {generating ? t('periodization.generating') : t('periodization.generateSmart')}
      </button>
      <button onClick={handleCreateEmpty} className="flex items-center justify-center gap-2 rounded-xl border border-border/30 bg-bg-elevated/15 px-4 py-3 text-sm text-muted min-h-[48px]">
        <Plus className="size-4" /> {t('periodization.createEmpty')}
      </button>
      {plans.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted font-semibold uppercase tracking-wider">{t('periodization.savedPlans')}</p>
          {plans.map((p) => (
            <button key={p.id} onClick={() => handleSetActive(p.id)} className="flex items-center gap-2 rounded-xl border border-border/15 bg-bg-elevated/20 px-3 py-2.5 text-left min-h-[48px]">
              <Check className="size-4 text-accent shrink-0" />
              <span className="flex-1 text-sm text-fg truncate">{p.name}</span>
              <span className="text-xs text-muted">{p.mesocycles.length} {t('periodization.mesocyclesShort')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
