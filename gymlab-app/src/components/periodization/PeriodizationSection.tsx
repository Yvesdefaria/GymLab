// Pestaña de periodización (C1): héroe de semana/fase + stats y el detalle del
// plan. Conserva generación automática, plan vacío, edición y planes guardados.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Plus, Trash2, Check } from 'lucide-react'
import { generateSmartPlan } from '@/domain/autoPeriodization'
import {
  createEmptyPlan,
  calculateTotalWeeks,
  getCurrentWeek,
  getMesocycleProgress,
  type Mesocycle,
} from '@/domain/periodization'
import { usePeriodization } from '@/hooks/usePeriodization'
import { useAchievementsData } from '@/hooks/useAchievementsData'
import { useLiveQuery } from 'dexie-react-hooks'
import { workoutRepo, exerciseRepo } from '@/data/repositories'
import { PeriodizationView } from './PeriodizationView'
import { StatsHero } from '@/components/stats/StatsHero'
import { StatsStatRow } from '@/components/stats/StatsStatRow'

export const PeriodizationSection = () => {
  const { t } = useTranslation()
  const { plans, activePlan, periodizationRepo } = usePeriodization()
  const [generating, setGenerating] = useState(false)

  const workouts = useLiveQuery(() => workoutRepo.getAll(), []) ?? []
  // F91/L3a: las series salen de la capa única (solo completadas, scan único
  // compartido, F103/T6) en vez de una lectura propia de workoutSets.
  const { completedSets: sets } = useAchievementsData()
  const exercises = useLiveQuery(() => exerciseRepo.getAll(), []) ?? []

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const plan = generateSmartPlan({
        workouts,
        sets,
        exercises,
        startDate: new Date().toISOString(),
        weeksLabel: t('periodization.weeksShort'),
      })
      const mesocycles = plan.mesocycles.map((meso) => ({
        ...meso,
        name: t(`stats.phaseNames.${meso.type}` as any),
      }))
      const id = await periodizationRepo.create({
        name: plan.name,
        startDate: plan.startDate,
        mesocycles,
        isActive: true,
      })
      await periodizationRepo.setActive(id)
    } finally {
      setGenerating(false)
    }
  }

  const handleCreateEmpty = async () => {
    const plan = createEmptyPlan(new Date().toISOString())
    const id = await periodizationRepo.create({
      name: t('stats.emptyPlanName'),
      startDate: plan.startDate,
      mesocycles: [],
      isActive: true,
    })
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
    const currentWeek = getCurrentWeek(planData, new Date().toISOString())
    const progress = getMesocycleProgress(planData.mesocycles, currentWeek)
    const currentMeso =
      progress.find((entry) => entry.progress > 0 && entry.progress < 1)?.mesocycle ??
      progress.find((entry) => entry.progress === 0)?.mesocycle ??
      progress.at(-1)?.mesocycle
    const deload = planData.mesocycles.find((meso) => meso.type === 'deload')
    const phaseLabel = currentMeso
      ? currentMeso.name || t(`periodization.type.${currentMeso.type}` as any)
      : '—'
    const progressPct =
      planData.totalWeeks > 0
        ? Math.round((currentWeek / planData.totalWeeks) * 100)
        : 0
    const stats = [
      {
        value: String(planData.totalWeeks),
        label: t('stats.durationWeeks'),
        color: 'bg-gold',
      },
      {
        value: String(planData.mesocycles.length),
        label: t('stats.mesocycles'),
        color: 'bg-data-cardio',
      },
      {
        value: deload ? String(deload.startWeek) : '—',
        label: t('stats.deloadWeek'),
        color: 'bg-data-fat',
      },
    ]

    return (
      <div className="flex flex-col gap-5">
        <StatsHero
          eyebrow={t('stats.heroBloqueActual')}
          value={t('stats.periodizationWeek', {
            current: currentWeek,
            total: planData.totalWeeks,
          })}
          valueClassName="text-[46px]"
          delta={
            currentMeso
              ? t('stats.periodizationPhase', {
                  phase: phaseLabel,
                  weeks: currentMeso.weeks,
                })
              : undefined
          }
          deltaTone="progress"
        >
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-fg/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold to-gold-bright"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </StatsHero>
        <StatsStatRow items={stats} />

        <PeriodizationView plan={planData} editable onSave={handleSave} compact />

        {plans.length > 1 && (
          <div className="flex flex-col">
            <p className="py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {t('periodization.otherPlans')}
            </p>
            {plans
              .filter((plan) => plan.id !== activePlan.id)
              .map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center gap-2 border-t border-border/40 py-2"
                >
                  <button
                    onClick={() => handleSetActive(plan.id)}
                    className="min-h-11 flex-1 truncate text-left text-sm text-muted"
                  >
                    {plan.name}
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-danger"
                    aria-label={t('periodization.removeMesocycle')}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <StatsHero
        eyebrow={t('stats.heroBloqueActual')}
        value="—"
        delta={t('periodization.noActivePlan')}
        deltaTone="muted"
      />

      <div className="flex flex-col gap-2">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cta px-4 text-sm font-semibold text-on-gold disabled:opacity-50"
        >
          <Sparkles className="size-4" />
          {generating ? t('periodization.generating') : t('periodization.generateSmart')}
        </button>
        <button
          onClick={handleCreateEmpty}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border/40 px-4 text-sm text-muted"
        >
          <Plus className="size-4" />
          {t('periodization.createEmpty')}
        </button>
      </div>

      {plans.length > 0 && (
        <div className="flex flex-col">
          <p className="py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {t('periodization.savedPlans')}
          </p>
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => handleSetActive(plan.id)}
              className="flex min-h-11 items-center gap-2 border-t border-border/40 py-2 text-left"
            >
              <Check className="size-4 shrink-0 text-gold" />
              <span className="min-w-0 flex-1 truncate text-sm text-fg">{plan.name}</span>
              <span className="text-[10px] text-muted">
                {plan.mesocycles.length} {t('periodization.mesocyclesShort')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
