// Wizard de bienvenida (F132.9): 7 pasos, una decisión por pantalla y shell
// Nocturno Minimal. El cuerpo vive separado del gate para que sus hooks pesados
// no queden montados cuando el onboarding ya terminó (F120/ONB-1).
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Play, X } from 'lucide-react'
import { activeProgramRepo, bodyWeightRepo, metaRepo, profileRepo, routineRepo } from '@/data/repositories'
import type { RoutineDraft } from '@/data/repositories/types'
import { useRoutinePlan } from '@/hooks/useRoutinePlan'
import { useSettings } from '@/hooks/useSettings'
import {
  HEIGHT_RANGE,
  isBirthDateValid,
  ONBOARDING_ANSWERS_META_KEY,
  ONBOARDING_DONE_META_KEY,
  weekdaysForDays,
  type OnboardingAnswers,
  WEIGHT_RANGE,
} from '@/domain/onboarding'
import { TOUR_PENDING_META_KEY } from '@/domain/tour'
import { hasPlannedDays } from '@/domain/routineResolution'
import { usePlanNaming } from '@/hooks/usePlanNaming'
import { uniqueSlug } from '@/domain/routines'
import { toLocalDateStr } from '@/domain/dates'
import { useEquipmentStore } from '@/store/equipmentStore'
import {
  BIRTH_DATE_KEY,
  BODY_SEX_KEY,
  HEIGHT_KEY,
  isProfileNameValid,
  normalizeProfileName,
  PROFILE_NAME_KEY,
  weeklyGoalFromDays,
} from '@/domain/profileMeta'
import { parseWeightToKg } from '@/domain/settings'
import { applyLanguage, type I18nKey } from '@/i18n'
import { prefersReducedMotion, slideIn, slideOut, type SlideDirection } from '@/lib/animations'
import { track } from '@/lib/telemetry'
import {
  DaysStep,
  IdentityStep,
  LanguageStep,
  MeasurementsStep,
  ObjectiveStep,
  SessionStep,
  SummaryStep,
  type OnboardingState,
} from './steps'

const STEPS: I18nKey[] = [
  'onboarding.stepIdioma',
  'onboarding.stepObjetivo',
  'onboarding.stepDias',
  'onboarding.stepSesion',
  'onboarding.stepIdentidad',
  'onboarding.stepMedidas',
  'onboarding.stepResumen',
]

// Estado inicial razonable para que el plan de rutina nunca quede vacío.
const initial: OnboardingState = {
  language: null,
  name: '',
  objective: null,
  level: 'principiante',
  daysPerWeek: null,
  materialBucket: null,
  sessionDurationMin: 60,
  cardioPerWeek: 1,
  units: 'kg',
  sex: null,
  birthDate: '',
  heightCm: undefined,
  weightKg: undefined,
  guideInterests: [],
  acceptedTerms: false,
}

export const OnboardingWizard = () => {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [state, setState] = useState<OnboardingState>(initial)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const { settings, update: updateSettings } = useSettings()
  const equipment = useEquipmentStore((s) => s.selected)
  const naming = usePlanNaming()

  // Plan compartido con el planificador (F120/ONB-2): se carga recién en el resumen.
  const { plan, slugs: allSlugs, exerciseById } = useRoutinePlan(
    {
      level: state.level,
      objective: state.objective ?? 'general',
      daysPerWeek: state.daysPerWeek ?? 3,
      equipment,
      sessionDurationMin: state.sessionDurationMin,
      naming,
    },
    step === STEPS.length - 1,
  )

  const scrollerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelPrev = useRef(step)
  const pendingDir = useRef<SlideDirection | null>(null)
  const [leaving, setLeaving] = useState<{ node: ReactNode; dir: SlideDirection } | null>(null)

  useEffect(() => {
    if (state.language) void applyLanguage(state.language)
  }, [state.language])

  // Entrada del nuevo paso desde el lado opuesto al que sale el anterior.
  useEffect(() => {
    if (panelPrev.current === step) return
    panelPrev.current = step
    const dir = pendingDir.current
    pendingDir.current = null
    if (dir && panelRef.current && !prefersReducedMotion()) {
      slideIn(panelRef.current, dir === 'left' ? 'right' : 'left', { duration: 240 })
    }
    // El foco vuelve al inicio del scroller para que el lector anuncie la pregunta nueva.
    scrollerRef.current?.focus({ preventScroll: true })
  }, [step])

  const patch = (p: Partial<OnboardingState>) => setState((s) => ({ ...s, ...p }))

  const heightNum = state.heightCm ?? Number.NaN
  const heightValid = Number.isFinite(heightNum) && heightNum >= HEIGHT_RANGE.min && heightNum <= HEIGHT_RANGE.max
  const weightNum = state.weightKg === undefined ? Number.NaN : parseWeightToKg(state.weightKg, state.units)
  const weightValid = Number.isFinite(weightNum) && weightNum >= WEIGHT_RANGE.min && weightNum <= WEIGHT_RANGE.max
  const identityValid = isProfileNameValid(state.name) && state.sex !== null
  const measurementsValid = isBirthDateValid(state.birthDate) && heightValid && weightValid

  const answers: OnboardingAnswers = {
    name: normalizeProfileName(state.name),
    objective: state.objective ?? 'general',
    daysPerWeek: state.daysPerWeek ?? 3,
    level: state.level,
    language: state.language ?? 'en',
    units: state.units,
    sex: state.sex ?? 'male',
    birthDate: state.birthDate,
    heightCm: heightValid ? heightNum : 0,
    weightKg: weightValid ? weightNum : 0,
    sessionDurationMin: state.sessionDurationMin,
    cardioPerWeek: state.cardioPerWeek,
    guideInterests: state.guideInterests,
    acceptedTerms: state.acceptedTerms,
  }

  const canNext =
    step === 0
      ? state.language !== null
      : step === 1
        ? state.objective !== null
        : step === 2
          ? state.daysPerWeek !== null
          : step === 3
            ? true
            : step === 4
              ? identityValid
              : step === 5
                ? measurementsValid
                : true

  const finish = async ({ withRoutine, offerTour }: { withRoutine: boolean; offerTour: boolean }) => {
    setBusy(true)
    setSaveError(false)
    try {
      // F101: el tour queda pendiente ANTES de onboardingDone y de las demás escrituras.
      if (offerTour) await metaRepo.setJson(TOUR_PENDING_META_KEY, true)
      // El blob solo se escribe si el usuario pasó por Identidad: el «Ya entreno aquí»
      // del primer paso no debe sembrar el planificador con defaults que nadie eligió.
      if (isProfileNameValid(state.name)) await metaRepo.setJson(ONBOARDING_ANSWERS_META_KEY, answers)
      if (settings.units !== state.units || settings.language !== state.language) {
        await updateSettings({
          units: state.units,
          measurementSystem: state.units === 'lb' ? 'imperial' : 'metric',
          language: state.language ?? settings.language,
        })
      }
      if (withRoutine && hasPlannedDays(plan)) {
        const draft: RoutineDraft = {
          slug: uniqueSlug(plan.title, allSlugs),
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
        const routineId = await routineRepo.createRoutine(draft)
        await activeProgramRepo.set({
          routineId,
          startDate: toLocalDateStr(),
          weekdays: weekdaysForDays(answers.daysPerWeek),
          createdAt: new Date().toISOString(),
        })
      }
      if (answers.heightCm > 0) await metaRepo.setJson(HEIGHT_KEY, answers.heightCm)
      if (state.sex !== null) await metaRepo.setJson(BODY_SEX_KEY, state.sex)
      if (isBirthDateValid(state.birthDate)) await metaRepo.setJson(BIRTH_DATE_KEY, state.birthDate)
      if (isProfileNameValid(state.name)) await metaRepo.setJson(PROFILE_NAME_KEY, answers.name)
      if (answers.weightKg > 0) {
        await bodyWeightRepo.upsert({ localDate: toLocalDateStr(), weightKg: answers.weightKg })
      }
      await profileRepo.ensure()
      await profileRepo.update({
        weeklyGoal: weeklyGoalFromDays(answers.daysPerWeek),
        ...(isProfileNameValid(state.name) ? { displayName: answers.name } : {}),
      })
      track('goal_updated', {})
      await metaRepo.setJson(ONBOARDING_DONE_META_KEY, true)
      track('onboarding_completed', { withRoutine })
    } catch {
      setSaveError(true)
    } finally {
      setBusy(false)
    }
  }

  const stepNode =
    step === 0 ? (
      <LanguageStep state={state} onChange={patch} />
    ) : step === 1 ? (
      <ObjectiveStep state={state} onChange={patch} />
    ) : step === 2 ? (
      <DaysStep state={state} onChange={patch} />
    ) : step === 3 ? (
      <SessionStep state={state} onChange={patch} />
    ) : step === 4 ? (
      <IdentityStep state={state} onChange={patch} />
    ) : step === 5 ? (
      <MeasurementsStep state={state} onChange={patch} />
    ) : (
      <SummaryStep state={state} onChange={patch} plan={plan} exerciseById={exerciseById} />
    )

  const goTo = (next: number) => {
    if (next === step) return
    if (!prefersReducedMotion()) {
      const dir: SlideDirection = next > step ? 'left' : 'right'
      pendingDir.current = dir
      setLeaving({ node: stepNode, dir })
    }
    setStep(next)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-bg"
      role="dialog"
      aria-modal="true"
      aria-label={t('onboarding.registroAria')}
    >
      {/* Barra superior: wordmark/«Atrás» y escape del primer paso. */}
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        {step === 0 ? (
          <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] gold-text">
            GymLab
          </span>
        ) : (
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            className="inline-flex min-h-11 items-center gap-1 text-xs text-muted transition-colors hover:text-accent-soft"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t('onboarding.atras')}
          </button>
        )}
        {step === 0 ? (
          <button
            type="button"
            onClick={() => void finish({ withRoutine: false, offerTour: false })}
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-1 text-xs text-muted transition-colors hover:text-accent-soft disabled:opacity-40"
          >
            <X className="size-4" aria-hidden />
            {t('onboarding.yaEntrenoAqui')}
          </button>
        ) : (
          <span className="min-w-11" aria-hidden />
        )}
      </div>

      {/* Progreso: puntos + paso actual. */}
      <div className="mx-auto w-full max-w-md px-5 pt-3">
        <div className="flex items-center gap-1.5" aria-label={t('onboarding.progresoAria')}>
          <span className="flex flex-1 items-center gap-1.5" aria-hidden>
            {STEPS.map((labelKey, index) => (
              <span
                key={labelKey}
                className={
                  index === step
                    ? 'h-1.5 w-4 rounded-full bg-cta'
                    : index < step
                      ? 'size-1.5 rounded-full bg-cta'
                      : 'size-1.5 rounded-full bg-border/60'
                }
              />
            ))}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t('onboarding.paso', { current: step + 1, total: STEPS.length })}
          </span>
        </div>
      </div>

      {/* Cuerpo scrolleable. El foco va al scroller al cambiar de paso. */}
      <div
        ref={scrollerRef}
        data-testid="onboarding-scroller"
        tabIndex={-1}
        className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-7 outline-none"
      >
        <div className="relative mx-auto w-full max-w-md">
          {leaving && (
            <div
              className="absolute inset-0 z-10 overflow-hidden"
              aria-hidden
              ref={(el) => {
                if (el) {
                  slideOut(el, leaving.dir, {
                    duration: 200,
                    easing: 'outCubic',
                    onComplete: () => setLeaving((prev) => (prev?.node === leaving.node ? null : prev)),
                  })
                }
              }}
            >
              {leaving.node}
            </div>
          )}
          <div ref={panelRef}>{stepNode}</div>
        </div>
      </div>

      {/* CTA fija: una acción primaria y, en el resumen, el cierre sin rutina. */}
      <div className="mx-auto w-full max-w-md px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => goTo(step + 1)}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-cta font-display text-base font-semibold text-on-gold transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {t('onboarding.continuar')}
            <ArrowRight className="size-5" aria-hidden />
          </button>
        ) : (
          <div>
            <button
              type="button"
              disabled={busy || !hasPlannedDays(plan) || !state.acceptedTerms}
              onClick={() => void finish({ withRoutine: true, offerTour: true })}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-cta font-display text-base font-semibold text-on-gold transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Play className="size-5" fill="currentColor" aria-hidden />
              {t('onboarding.empezarD1')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void finish({ withRoutine: false, offerTour: true })}
              className="mt-2 min-h-11 w-full text-center text-xs text-muted underline transition-colors hover:text-accent-soft disabled:opacity-40"
            >
              {t('onboarding.yaEntrenoAqui')}
            </button>
          </div>
        )}
        {saveError && (
          <p role="alert" className="mt-3 text-xs text-danger">
            {t('onboarding.guardarError')}
          </p>
        )}
      </div>
    </div>
  )
}
