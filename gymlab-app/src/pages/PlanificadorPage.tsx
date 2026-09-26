// Página /rutinas/planificador: wizard de 3 pasos (nivel → objetivo → días + duración +
// equipamiento) que arma un plan con `planRoutine` (predefinida que calce o generada
// contra el catálogo), lo muestra en cards (dirección A) y lo guarda como rutina PROPIA
// editable desde el builder.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Sparkles } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { EquipmentFilter } from '@/components/equipment/EquipmentFilter'
import { PlanCoverageNote } from '@/components/routines/PlanCoverageNote'
import { PlanPreview } from '@/components/routines/PlanPreview'
import { metaRepo, routineRepo } from '@/data/repositories'
import { persistPlanAsRoutine, planToRoutineDraft } from '@/data/routinePersistence'
import { usePlanNaming } from '@/hooks/usePlanNaming'
import { useRoutines, useRoutineSlugs } from '@/hooks/useRoutines'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useEquipmentStore } from '@/store/equipmentStore'
import {
  DEFAULT_SESSION_DURATION_MIN,
  planRoutine,
  requiredEquipmentOf,
  type RoutinePlan,
} from '@/domain/routineResolution'
import { uniqueSlug } from '@/domain/routines'
import { LEVELS, OBJECTIVES } from '@/domain/catalog'
import { localizeExercise, localizeMuscleGroup } from '@/i18n/catalog'
import { ONBOARDING_ANSWERS_META_KEY, type AppLanguage } from '@/domain/onboarding'
import type { Level, Objective } from '@/domain/types'
import type { I18nKey } from '@/i18n'

const DAY_OPTIONS = [2, 3, 4, 5, 6]
const DURATION_OPTIONS = [30, 45, 60, 90]

// Claves tipadas: `t()` está tipado contra el esquema `es`, así que no se pueden
// construir los dot-paths por template string.
const LEVEL_KEYS: Record<Level, I18nKey> = {
  principiante: 'planner.levels.principiante',
  intermedio: 'planner.levels.intermedio',
  avanzado: 'planner.levels.avanzado',
}
const OBJECTIVE_KEYS: Record<Objective, I18nKey> = {
  volumen: 'planner.objectives.volumen',
  definicion: 'planner.objectives.definicion',
  fuerza: 'planner.objectives.fuerza',
  resistencia: 'planner.objectives.resistencia',
  general: 'planner.objectives.general',
}
const DAY_OPTION_KEYS: Record<number, I18nKey> = {
  2: 'planner.days2',
  3: 'planner.days3',
  4: 'planner.days4',
  5: 'planner.days5',
  6: 'planner.days6',
}

export const PlanificadorPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const navigate = useNavigate()
  const equipment = useEquipmentStore((s) => s.selected)
  const { routines } = useRoutines()
  const { slugs: allSlugs } = useRoutineSlugs()
  const { exercises, loading: catalogLoading } = useExerciseCatalog()
  const naming = usePlanNaming()

  const [step, setStep] = useState(0)
  const [level, setLevel] = useState<Level>('principiante')
  const [objective, setObjective] = useState<Objective>('volumen')
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [sessionDurationMin, setSessionDurationMin] = useState(DEFAULT_SESSION_DURATION_MIN)
  const [generated, setGenerated] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  // Default de duración desde el onboarding (respuestas persistidas) mientras el usuario
  // no elija otra cosa en el paso de días.
  useEffect(() => {
    let active = true
    metaRepo
      .getJson<{ sessionDurationMin?: number } | null>(ONBOARDING_ANSWERS_META_KEY, null)
      .then((answers) => {
        if (active && answers?.sessionDurationMin) setSessionDurationMin(answers.sessionDurationMin)
      })
    return () => {
      active = false
    }
  }, [])

  // Días e ítems de TODAS las rutinas, para derivar el equipamiento que exige cada una.
  // Se cargan recién al generar: es un fan-out de dos consultas por rutina que no hace
  // falta antes y que el e2e no debería pagar en cada render del wizard.
  const routineData = useLiveQuery(async () => {
    if (!generated) return null
    const days = (await Promise.all(routines.map((r) => routineRepo.getDays(r.id)))).flat()
    const items = (await Promise.all(days.map((d) => routineRepo.getItems(d.id)))).flat()
    return { days, items }
  }, [generated, routines])

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])

  // El plan se arma una sola vez con los datos cargados: predefinida si calza, generada si no.
  const plan = useMemo(() => {
    if (!routineData || catalogLoading) return undefined
    const requiredByRoutineId = new Map(
      routines.map((r) => [r.id, requiredEquipmentOf(r.id, routineData.days, routineData.items, exerciseById)]),
    )
    return planRoutine(
      { level, objective, daysPerWeek, equipment, sessionDurationMin, naming },
      routines,
      exercises,
      requiredByRoutineId,
      routineData.days,
      routineData.items,
    )
  }, [
    routineData,
    catalogLoading,
    routines,
    exercises,
    exerciseById,
    level,
    objective,
    daysPerWeek,
    equipment,
    sessionDurationMin,
    naming,
  ])

  // Persiste el plan como rutina propia (isCustom) y navega a su detalle; si la
  // escritura falla, se muestra el error y se queda en la página (R3-001).
  const save = async () => {
    if (!plan || plan.days.length === 0) return
    setSaving(true)
    setSaveError(false)
    try {
      const draft = planToRoutineDraft(plan, { slug: uniqueSlug(plan.title, allSlugs) })
      const result = await persistPlanAsRoutine(routineRepo, draft)
      if (result.ok) navigate(`/rutinas/${result.slug}`)
      else setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  const optionClass = (active: boolean) =>
    `min-h-[44px] rounded-xl border px-3 text-left text-sm font-medium transition-colors ${
      active ? 'border-accent bg-accent/10 text-accent' : 'border-border/30 bg-bg-elevated/30 text-muted'
    }`

  const exerciseName = (id: number) => {
    const exercise = exerciseById.get(id)
    return exercise ? localizeExercise(exercise, lang).name : t('planner.exerciseFallback', { id })
  }

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">{t('planner.step1')}</p>
          {LEVELS.map((l) => (
            <button key={l} type="button" onClick={() => { setLevel(l); setStep(1) }} className={optionClass(level === l)}>
              {t(LEVEL_KEYS[l])}
            </button>
          ))}
        </div>
      )
    }

    if (step === 1) {
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">{t('planner.step2')}</p>
          {OBJECTIVES.map((o) => (
            <button key={o} type="button" onClick={() => { setObjective(o); setStep(2) }} className={optionClass(objective === o)}>
              {t(OBJECTIVE_KEYS[o])}
            </button>
          ))}
          <button type="button" onClick={() => setStep(0)} className="inline-flex min-h-[44px] items-center gap-1 self-start text-xs text-muted">
            <ChevronLeft className="size-4" aria-hidden /> {t('planner.back')}
          </button>
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">{t('planner.step3')}</p>
          <div className="flex gap-2">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDaysPerWeek(d)}
                className={`min-h-[44px] flex-1 rounded-xl border px-2 text-xs font-medium transition-colors ${
                  daysPerWeek === d ? 'border-accent bg-accent text-accent-fg' : 'border-border/30 bg-bg-elevated/50 text-muted'
                }`}
              >
                {t(DAY_OPTION_KEYS[d])}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted">{t('planner.duration')}</p>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((min) => (
                <Chip key={min} active={sessionDurationMin === min} onClick={() => setSessionDurationMin(min)}>
                  {min} min
                </Chip>
              ))}
            </div>
          </div>
          <EquipmentFilter />
          <p className="text-[11px] text-muted">{t('planner.equipmentHint')}</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setStep(1)} className="inline-flex min-h-[44px] items-center gap-1 text-xs text-muted">
              <ChevronLeft className="size-4" aria-hidden /> {t('planner.back')}
            </button>
            <Button className="flex-1" onClick={() => { setGenerated(true); setStep(3) }}>
              {t('planner.generate')}
            </Button>
          </div>
        </div>
      )
    }

    if (!plan) return <p className="text-sm text-muted">{t('planner.generating')}</p>
    return renderResult(plan)
  }

  const renderResult = (p: RoutinePlan) => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-accent" aria-hidden />
        <p className="font-display text-lg text-accent">{t('planner.result')}</p>
      </div>

      {p.days.length === 0 ? (
        <p className="panel rounded-2xl p-4 text-sm text-muted">{t('planner.empty')}</p>
      ) : null}

      <PlanCoverageNote
        omittedGroups={p.coverage.omittedGroups.map((g) => localizeMuscleGroup(g, lang))}
        droppedDays={p.coverage.droppedDays}
      />

      <PlanPreview
        plan={p}
        exerciseName={exerciseName}
        exerciseGroup={(id) => exerciseById.get(id)?.muscleGroup}
        muscleLabel={(group) => localizeMuscleGroup(group, lang)}
      />

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => { setGenerated(false); setStep(0) }}
          className="min-h-[44px] rounded-xl border border-border/40 px-3 text-xs text-muted"
        >
          {t('planner.restart')}
        </button>
        <Button className="flex-1" onClick={save} disabled={saving || p.days.length === 0}>
          {saving ? t('planner.saving') : t('planner.save')}
        </Button>
      </div>
      {saveError && (
        <p role="alert" className="text-xs text-[var(--color-danger)]">
          {t('planner.saveError')}
        </p>
      )}
    </div>
  )

  return (
    <div>
      <AppHeader title={t('planner.title')} subtitle={t('planner.subtitle')} />
      <div className="space-y-4 p-4 pb-8">
        <BackLink to="/rutinas" label={t('rutinas.titulo')} />
        {renderStep()}
      </div>
    </div>
  )
}
