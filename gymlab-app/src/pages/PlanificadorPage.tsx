// Página /rutinas/planificador: wizard de 3 pasos (nivel → objetivo → días + equipamiento)
// que arma un plan con `planRoutine` (predefinida que calce o generada contra el catálogo)
// y lo guarda como rutina PROPIA editable desde el builder.
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Sparkles } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { EquipmentFilter } from '@/components/equipment/EquipmentFilter'
import { routineRepo } from '@/data/repositories'
import type { RoutineDraft } from '@/data/repositories/types'
import { useRoutines, useRoutineSlugs } from '@/hooks/useRoutines'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useEquipmentStore } from '@/store/equipmentStore'
import { planRoutine, requiredEquipmentOf, type RoutinePlan } from '@/domain/routineResolution'
import { uniqueSlug } from '@/domain/routines'
import { LEVELS, OBJECTIVES } from '@/domain/catalog'
import { localizeEquipmentList, localizeExercise, localizeMuscleGroup } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'
import type { Level, MuscleGroup, Objective } from '@/domain/types'
import type { I18nKey } from '@/i18n'

const DAY_OPTIONS = [3, 4, 5, 6]

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
const DAY_KEYS: I18nKey[] = ['planner.day1', 'planner.day2', 'planner.day3', 'planner.day4', 'planner.day5', 'planner.day6']
const DAY_OPTION_KEYS: Record<number, I18nKey> = { 3: 'planner.days3', 4: 'planner.days4', 5: 'planner.days5', 6: 'planner.days6' }

export const PlanificadorPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const navigate = useNavigate()
  const equipment = useEquipmentStore((s) => s.selected)
  const { routines } = useRoutines()
  const { slugs: allSlugs } = useRoutineSlugs()
  const { exercises, loading: catalogLoading } = useExerciseCatalog()

  const [step, setStep] = useState(0)
  const [level, setLevel] = useState<Level>('principiante')
  const [objective, setObjective] = useState<Objective>('volumen')
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [generated, setGenerated] = useState(false)
  const [saving, setSaving] = useState(false)

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
      { level, objective, daysPerWeek, equipment },
      routines,
      exercises,
      requiredByRoutineId,
      routineData.days,
      routineData.items,
    )
  }, [routineData, catalogLoading, routines, exercises, exerciseById, level, objective, daysPerWeek, equipment])

  // Persiste el plan como rutina propia (isCustom) y navega a su detalle.
  const save = async () => {
    if (!plan || plan.days.length === 0) return
    setSaving(true)
    try {
      const slug = uniqueSlug(plan.title, allSlugs)
      const draft: RoutineDraft = {
        slug,
        title: plan.title,
        objective: plan.objective,
        level: plan.level,
        description: '',
        basedOnId: plan.basedOnId,
        days: plan.days.map((d) => ({
          name: d.name,
          items: d.items.map((it, index) => ({
            exerciseId: it.exerciseId,
            targetSets: it.targetSets,
            targetReps: it.targetReps,
            restSec: it.restSec,
            order: index + 1,
          })),
        })),
      }
      await routineRepo.createRoutine(draft)
      navigate(`/rutinas/${slug}`)
    } finally {
      setSaving(false)
    }
  }

  const optionClass = (active: boolean) =>
    `min-h-[44px] rounded-xl border px-3 text-left text-sm font-medium transition-colors ${
      active ? 'border-accent bg-accent/10 text-accent' : 'border-border/30 bg-bg-elevated/30 text-muted'
    }`

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

  const renderResult = (p: RoutinePlan) => {
    const omitted = p.coverage.omittedGroups.map((g) => localizeMuscleGroup(g, lang))
    const dropped = p.coverage.droppedDays
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent" aria-hidden />
          <p className="font-display text-lg text-accent">{t('planner.result')}</p>
        </div>

        {p.days.length === 0 ? (
          <p className="panel rounded-2xl p-4 text-sm text-muted">{t('planner.empty')}</p>
        ) : null}

        {omitted.length > 0 || dropped.length > 0 ? (
          <div className="rounded-xl border border-border/40 bg-bg-elevated/30 px-3 py-2 text-[11px] text-muted">
            {omitted.length > 0 ? <p>{t('planner.coverageOmitted', { groups: omitted.join(', ') })}</p> : null}
            {dropped.length > 0 ? <p>{t('planner.coverageDropped', { days: dropped.join(', ') })}</p> : null}
          </div>
        ) : null}

        {p.days.map((day) => {
          const groups = [
            ...new Set(
              day.items
                .map((it) => exerciseById.get(it.exerciseId)?.muscleGroup)
                .filter((g): g is MuscleGroup => Boolean(g)),
            ),
          ].map((g) => localizeMuscleGroup(g, lang))
          return (
            <div key={day.dayNumber} className="rounded-2xl border border-border/30 bg-bg-elevated/30 px-3 py-3">
              <p className="text-sm font-semibold text-fg">{t(DAY_KEYS[day.dayNumber - 1] ?? 'planner.day1')}</p>
              {groups.length > 0 ? <p className="text-[11px] text-muted">{groups.join(', ')}</p> : null}
              <div className="mt-2 flex flex-col gap-1.5">
                {day.items.map((item, i) => {
                  const ex = exerciseById.get(item.exerciseId)
                  return (
                    <div key={`${item.exerciseId}-${i}`} className="flex items-baseline justify-between gap-2">
                      {ex ? (
                        <Link to={`/ejercicios/${ex.slug}`} className="min-w-0 truncate text-xs text-fg underline-offset-2 hover:underline">
                          {localizeExercise(ex, lang).name}
                        </Link>
                      ) : (
                        <span className="min-w-0 truncate text-xs text-fg">{`Ejercicio ${item.exerciseId}`}</span>
                      )}
                      <span className="shrink-0 text-[11px] text-muted">
                        {item.targetSets}×{item.targetReps}
                        {ex ? ` · ${localizeEquipmentList(ex.equipment, lang)}` : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

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
      </div>
    )
  }

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
