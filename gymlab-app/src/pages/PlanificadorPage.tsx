// Página /rutinas/planificador: wizard de una pregunta por pantalla (nivel → objetivo →
// días/duración/equipamiento) que arma un plan con `planRoutine` y lo guarda como rutina
// propia. El resultado se lee como secciones hairline, sin tarjetas.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { SHELL_MAX_W } from '@/components/layout/shellWidth'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { EquipmentFilter } from '@/components/equipment/EquipmentFilter'
import { PlanCoverageNote } from '@/components/routines/PlanCoverageNote'
import { PlanPreview } from '@/components/routines/PlanPreview'
import { metaRepo, routineRepo } from '@/data/repositories'
import { persistPlanAsRoutine, planToRoutineDraft } from '@/data/routinePersistence'
import { usePlanNaming } from '@/hooks/usePlanNaming'
import { useRoutinePlan } from '@/hooks/useRoutinePlan'
import { useEquipmentStore } from '@/store/equipmentStore'
import { DEFAULT_SESSION_DURATION_MIN, type RoutinePlan } from '@/domain/routineResolution'
import { uniqueSlug } from '@/domain/routines'
import { LEVELS, OBJECTIVES } from '@/domain/catalog'
import { localizeExercise, localizeMuscleGroup } from '@/i18n/catalog'
import {
  ONBOARDING_ANSWERS_META_KEY,
  plannerPrefillFromAnswers,
  type AppLanguage,
  type OnboardingAnswers,
} from '@/domain/onboarding'
import type { Level, Objective } from '@/domain/types'
import type { I18nKey } from '@/i18n'

const DAY_OPTIONS = [2, 3, 4, 5, 6]
const DURATION_OPTIONS = [30, 45, 60, 90]
// Pasos del wizard: un único mapa para el estado, los guards y el contador.
const STEP = { level: 0, objective: 1, config: 2, result: 3 } as const
const TOTAL_STEPS = STEP.result

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

// Fila de opción única: hairline de 56 px con chevron; elegir avanza solo. La opción
// ya elegida queda marcada al volver con «Atrás» (`aria-current` + acento).
const OptionRow = ({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={selected ? 'true' : undefined}
    className={`flex min-h-[56px] w-full items-center justify-between gap-3 border-b border-border/40 text-left text-sm transition-colors ${
      selected ? 'text-accent-soft' : 'text-fg hover:text-accent-soft'
    }`}
  >
    <span className="min-w-0 truncate">{label}</span>
    <ChevronRight className={`size-4 shrink-0 ${selected ? 'text-cta' : 'text-muted'}`} aria-hidden />
  </button>
)

const BackStep = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="inline-flex min-h-[44px] items-center gap-1 text-xs text-muted">
    <ChevronLeft className="size-4" aria-hidden /> {label}
  </button>
)

export const PlanificadorPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const navigate = useNavigate()
  const equipment = useEquipmentStore((s) => s.selected)
  const naming = usePlanNaming()

  const [step, setStep] = useState(0)
  const [level, setLevel] = useState<Level>('principiante')
  const [objective, setObjective] = useState<Objective>('volumen')
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [sessionDurationMin, setSessionDurationMin] = useState(DEFAULT_SESSION_DURATION_MIN)
  const [generated, setGenerated] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  // Defaults del onboarding (respuestas persistidas): objetivo, nivel, días y duración.
  // Se aplican una sola vez al montar; si el blob falta o trae valores inválidos,
  // quedan los defaults de la página y el usuario puede cambiarlos igual.
  useEffect(() => {
    let active = true
    metaRepo
      .getJson<Partial<OnboardingAnswers> | null>(ONBOARDING_ANSWERS_META_KEY, null)
      .then((answers) => {
        if (!active) return
        const prefill = plannerPrefillFromAnswers(answers)
        if (prefill.objective) setObjective(prefill.objective)
        if (prefill.level) setLevel(prefill.level)
        if (prefill.daysPerWeek) setDaysPerWeek(prefill.daysPerWeek)
        if (prefill.sessionDurationMin) setSessionDurationMin(prefill.sessionDurationMin)
      })
    return () => {
      active = false
    }
  }, [])

  // Plan compartido con el onboarding (F120/ONB-2): días/ítems en lote y equipamiento
  // exigido en una pasada, recién al generar. Los slugs salen de la MISMA lista de
  // rutinas (F120/PLAN-3), sin segunda suscripción; solo se usan al guardar.
  const { plan, slugs: allSlugs, exerciseById } = useRoutinePlan(
    { level, objective, daysPerWeek, equipment, sessionDurationMin, naming },
    generated,
  )

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

  const goBack = () => setStep((prev) => Math.max(0, prev - 1))

  // OptionRow/BackStep viven fuera del componente: recrearlas en cada render
  // remontaría los botones y perdería el foco del teclado.
  const exerciseName = (id: number) => {
    const exercise = exerciseById.get(id)
    return exercise ? localizeExercise(exercise, lang).name : t('planner.exerciseFallback', { id })
  }

  const renderStep = () => {
    if (step === STEP.level) {
      return (
        <div>
          <h2 className="font-display text-2xl font-normal text-fg">{t('planner.step1')}</h2>
          <div className="mt-4">
            {LEVELS.map((l) => (
              <OptionRow
                key={l}
                label={t(LEVEL_KEYS[l])}
                selected={level === l}
                onClick={() => {
                  setLevel(l)
                  setStep(STEP.objective)
                }}
              />
            ))}
          </div>
        </div>
      )
    }

    if (step === STEP.objective) {
      return (
        <div>
          <h2 className="font-display text-2xl font-normal text-fg">{t('planner.step2')}</h2>
          <div className="mt-4">
            {OBJECTIVES.map((o) => (
              <OptionRow
                key={o}
                label={t(OBJECTIVE_KEYS[o])}
                selected={objective === o}
                onClick={() => {
                  setObjective(o)
                  setStep(STEP.config)
                }}
              />
            ))}
          </div>
          <div className="mt-3">
            <BackStep label={t('planner.back')} onClick={goBack} />
          </div>
        </div>
      )
    }

    return (
      <div>
        <h2 className="font-display text-2xl font-normal text-fg">{t('planner.step3')}</h2>

        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDaysPerWeek(d)}
              aria-pressed={daysPerWeek === d}
              className={`flex min-h-[44px] items-center justify-center rounded-xl border text-[11px] font-medium transition-colors ${
                daysPerWeek === d
                  ? 'border-cta bg-cta/15 text-accent-soft'
                  : 'border-border/40 text-muted'
              }`}
            >
              {t(DAY_OPTION_KEYS[d])}
            </button>
          ))}
        </div>

        <div className="mt-5 border-t border-border/40 pt-3">
          <p className="kicker mb-2">{t('planner.duration')}</p>
          <div className="flex flex-wrap gap-1.5">
            {DURATION_OPTIONS.map((min) => (
              <Chip key={min} active={sessionDurationMin === min} onClick={() => setSessionDurationMin(min)}>
                {min} min
              </Chip>
            ))}
          </div>
        </div>

        <div className="mt-5 border-t border-border/40 pt-3">
          <p className="kicker mb-2">{t('ejercicios.equipamiento.region')}</p>
          <EquipmentFilter />
          <p className="mt-1 text-[11px] text-muted">{t('planner.equipmentHint')}</p>
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-border/40 pt-3">
          <BackStep label={t('planner.back')} onClick={goBack} />
          <Button
            className="flex-1"
            onClick={() => {
              setSaveError(false)
              setGenerated(true)
              setStep(STEP.result)
            }}
          >
            {t('planner.generate')}
          </Button>
        </div>
      </div>
    )
  }

  const renderResult = (p: RoutinePlan) => (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl font-normal text-fg">{t('planner.result')}</h2>
        <span className="text-[10px] tabular-nums text-muted">
          {t('planner.planTitle', { objective: t(OBJECTIVE_KEYS[p.objective]), days: p.days.length })}
        </span>
      </div>

      <div className="mt-3 space-y-3">
        <PlanCoverageNote
          omittedGroups={p.coverage.omittedGroups.map((g) => localizeMuscleGroup(g, lang))}
          droppedDays={p.coverage.droppedDays}
        />

        {p.days.length === 0 ? <p className="text-sm text-muted">{t('planner.empty')}</p> : null}

        <PlanPreview
          plan={p}
          exerciseName={exerciseName}
          exerciseGroup={(id) => exerciseById.get(id)?.muscleGroup}
          muscleLabel={(group) => localizeMuscleGroup(group, lang)}
        />
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 bg-gradient-to-t from-bg via-bg/95 to-transparent px-4 pb-3 pt-6">
        <div className={`mx-auto ${SHELL_MAX_W} flex flex-col gap-1`}>
          <Button className="w-full" onClick={save} disabled={saving || p.days.length === 0}>
            {saving ? t('planner.saving') : t('planner.save')}
          </Button>
          <button
            type="button"
            onClick={() => {
              setSaveError(false)
              setGenerated(false)
              setStep(STEP.level)
            }}
            className="inline-flex min-h-[44px] items-center justify-center text-[11px] text-muted"
          >
            {t('planner.restart')}
          </button>
          {saveError && (
            <p role="alert" className="text-center text-xs text-danger">
              {t('planner.saveError')}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <AppHeader title={t('planner.title')} subtitle={t('planner.subtitle')} />
      <div className="space-y-5 px-4 pb-52 pt-3">
        <BackLink to="/rutinas" label={t('rutinas.titulo')} />

        {step < TOTAL_STEPS ? (
          <>
            <div className="flex items-center gap-3">
              <div className="flex flex-1 gap-1" aria-hidden>
                {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                  <span
                    key={i}
                    className={`h-0.5 flex-1 rounded-full ${i <= step ? 'bg-cta' : 'bg-border/50'}`}
                  />
                ))}
              </div>
              <span className="shrink-0 text-[10px] tabular-nums text-muted">
                {t('planner.stepOf', { n: step + 1, total: TOTAL_STEPS })}
              </span>
            </div>
            {renderStep()}
          </>
        ) : plan ? (
          renderResult(plan)
        ) : (
          <p className="text-sm text-muted">{t('planner.generating')}</p>
        )}
      </div>
    </div>
  )
}
