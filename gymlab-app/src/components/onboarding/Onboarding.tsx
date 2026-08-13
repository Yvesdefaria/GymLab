// Asistente de bienvenida de 5 pasos (idioma, objetivo, semana, perfil, resumen).
// Guarda las respuestas en meta (onboardingAnswers), sincroniza las unidades con
// Ajustes y sugiere una rutina inicial. Animación slideIn/slideOut entre pasos y
// stepper accesible con aria-current. Se oculta si ya se completó o hay sesiones.
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { activeProgramRepo, bodyWeightRepo, metaRepo, profileRepo } from '@/data/repositories'
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus'
import { useSettings } from '@/hooks/useSettings'
import {
  ONBOARDING_ANSWERS_META_KEY,
  ONBOARDING_DONE_META_KEY,
  isBirthDateValid,
  suggestRoutine,
  weekdaysForDays,
  type OnboardingAnswers,
} from '@/domain/onboarding'
import { toLocalDateStr } from '@/domain/dates'
import {
  BIRTH_DATE_KEY,
  BODY_SEX_KEY,
  HEIGHT_KEY,
  weeklyGoalFromDays,
} from '@/domain/profileMeta'
import { parseWeightToKg } from '@/domain/settings'
import { applyLanguage, type I18nKey } from '@/i18n'
import { slideIn, slideOut, type SlideDirection } from '@/lib/animations'
import {
  HEIGHT_RANGE,
  MATERIALS,
  WEIGHT_RANGE,
  LanguageStep,
  ObjectiveStep,
  ProfileStep,
  SummaryStep,
  WeekStep,
  type OnboardingState,
} from './steps'

const STEPS: I18nKey[] = ['onboarding.stepIdioma', 'onboarding.stepObjetivo', 'onboarding.stepSemana', 'onboarding.stepPerfil', 'onboarding.stepResumen']

// Estado inicial razonable para que la sugerencia de rutina nunca quede vacía.
const initial: OnboardingState = {
  language: null,
  objective: null,
  level: 'principiante',
  daysPerWeek: null,
  material: null,
  sessionDurationMin: 60,
  cardioPerWeek: 1,
  units: 'kg',
  sex: null,
  birthDate: '',
  heightCm: '',
  weightKg: '',
  guideInterests: [],
  acceptedTerms: false,
}

export const Onboarding = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [state, setState] = useState<OnboardingState>(initial)
  const [busy, setBusy] = useState(false)
  const { settings, update: updateSettings } = useSettings()
  const { done, workouts, routines } = useOnboardingStatus()

  // Transición slideIn/slideOut entre pasos (mismo patrón que TabNav).
  const panelRef = useRef<HTMLDivElement>(null)
  const panelPrev = useRef(step)
  const pendingDir = useRef<SlideDirection | null>(null)
  const [leaving, setLeaving] = useState<{ node: ReactNode; dir: SlideDirection } | null>(null)

  // Aplica el idioma elegido al instante (sin esperar a terminar el wizard).
  useEffect(() => {
    if (state.language) void applyLanguage(state.language)
  }, [state.language])

  // Entrada del nuevo paso desde el lado opuesto al que sale el anterior.
  // Debe ir ANTES del early return para no violar las Rules of Hooks.
  useEffect(() => {
    if (panelPrev.current === step) return
    panelPrev.current = step
    const dir = pendingDir.current
    pendingDir.current = null
    if (dir && panelRef.current) {
      slideIn(panelRef.current, dir === 'left' ? 'right' : 'left', { duration: 240 })
    }
  }, [step])

  if (done || workouts.length > 0) return null

  const patch = (p: Partial<OnboardingState>) => setState((s) => ({ ...s, ...p }))

  // El material solo acepta valores de la lista blanca (chips = única fuente).
  const safeMaterial = MATERIALS.includes(state.material ?? '') ? (state.material ?? '') : ''

  const heightNum = Number(state.heightCm)
  const heightValid = state.heightCm !== '' && Number.isFinite(heightNum) && heightNum >= HEIGHT_RANGE.min && heightNum <= HEIGHT_RANGE.max
  // El peso se introduce en la unidad elegida (kg o lb) y se valida siempre en kg.
  const weightNum = state.weightKg === '' ? Number.NaN : parseWeightToKg(Number(state.weightKg), state.units)
  const weightValid = Number.isFinite(weightNum) && weightNum >= WEIGHT_RANGE.min && weightNum <= WEIGHT_RANGE.max
  const profileValid = state.sex !== null && isBirthDateValid(state.birthDate) && heightValid && weightValid

  const answers: OnboardingAnswers = {
    objective: state.objective ?? 'general',
    daysPerWeek: state.daysPerWeek ?? 3,
    material: safeMaterial,
    level: state.level,
    language: state.language ?? 'es',
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
  const suggested = suggestRoutine(routines, answers)

  const canNext =
    (step === 0 && state.language !== null) ||
    (step === 1 && state.objective !== null) ||
    (step === 2 && state.daysPerWeek !== null && state.material !== null) ||
    (step === 3 && profileValid)

  // Guarda respuestas, sincroniza unidades con Ajustes, fija el programa, escribe los datos
  // útiles (altura, sexo, fecha nacimiento, peso inicial y objetivo semanal) y cierra el wizard.
  // Si ya se completó, no reescribe nada a la segunda vez.
  const finish = async (withRoutine: boolean) => {
    if (done) return
    setBusy(true)
    await metaRepo.setJson(ONBOARDING_ANSWERS_META_KEY, answers)
    if (settings.units !== state.units || settings.language !== state.language) {
      await updateSettings({
        units: state.units,
        measurementSystem: state.units === 'lb' ? 'imperial' : 'metric',
        language: state.language ?? settings.language,
      })
    }
    if (withRoutine && suggested) {
      await activeProgramRepo.set({
        routineId: suggested.id,
        startDate: toLocalDateStr(),
        weekdays: weekdaysForDays(answers.daysPerWeek),
        createdAt: new Date().toISOString(),
      })
    }
    // Datos útiles: solo se persisten los valores válidos de cada campo.
    if (answers.heightCm > 0) await metaRepo.setJson(HEIGHT_KEY, answers.heightCm)
    if (state.sex !== null) await metaRepo.setJson(BODY_SEX_KEY, state.sex)
    if (isBirthDateValid(state.birthDate)) await metaRepo.setJson(BIRTH_DATE_KEY, state.birthDate)
    if (answers.weightKg > 0) {
      await bodyWeightRepo.upsert({ localDate: toLocalDateStr(), weightKg: answers.weightKg })
    }
    await profileRepo.ensure()
    await profileRepo.update({ weeklyGoal: weeklyGoalFromDays(answers.daysPerWeek) })
    await metaRepo.setJson(ONBOARDING_DONE_META_KEY, true)
    setBusy(false)
    navigate('/')
  }

  const stepNode =
    step === 0 ? (
      <LanguageStep state={state} onChange={patch} />
    ) : step === 1 ? (
      <ObjectiveStep state={state} onChange={patch} />
    ) : step === 2 ? (
      <WeekStep state={state} onChange={patch} />
    ) : step === 3 ? (
      <ProfileStep state={state} onChange={patch} />
    ) : (
      <SummaryStep state={state} onChange={patch} suggested={suggested} />
    )

  const goTo = (next: number) => {
    if (next === step) return
    const dir: SlideDirection = next > step ? 'left' : 'right'
    pendingDir.current = dir
    setLeaving({ node: stepNode, dir })
    setStep(next)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] gold-text">GymLab</p>
          {step === 0 ? (
            <button
              type="button"
              onClick={() => void finish(false)}
              disabled={busy}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-border px-3 text-xs text-muted transition-colors hover:border-cta hover:text-accent-soft"
            >
              <X className="size-4" aria-hidden />
              {t('onboarding.yaEntrenoAqui')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-border px-3 text-xs text-muted transition-colors hover:border-cta hover:text-accent-soft"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t('onboarding.atras')}
            </button>
          )}
        </div>

        <ol className="mb-4 flex items-center" aria-label={t('onboarding.progresoAria')}>
          {STEPS.map((labelKey, i) => (
            <li key={labelKey} className="flex flex-1 items-center" aria-current={step === i ? 'step' : undefined}>
              <span
                title={t(labelKey)}
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i <= step ? 'bg-cta text-on-gold' : 'border border-border text-muted'
                }`}
              >
                {i + 1}
              </span>
              {i < STEPS.length - 1 ? (
                <span aria-hidden className={`mx-1 h-0.5 flex-1 rounded-full ${i < step ? 'bg-cta' : 'bg-border'}`} />
              ) : null}
            </li>
          ))}
        </ol>

        <div className="relative">
          {leaving && (
            <div
              className="absolute inset-0 z-10 overflow-hidden"
              aria-hidden
              ref={(el) => {
                if (el) {
                  slideOut(el, leaving.dir, {
                    duration: 200,
                    easing: 'easeOutCubic',
                    onComplete: () => setLeaving((prev) => (prev?.node === leaving.node ? null : prev)),
                  })
                }
              }}
            >
              {leaving.node}
            </div>
          )}
          <div ref={panelRef} className="panel rounded-3xl p-5">
            {stepNode}
          </div>
        </div>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => goTo(step + 1)}
            className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-cta font-display text-base font-semibold text-on-gold shadow-lg transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {t('onboarding.continuar')}
            <ArrowRight className="size-5" aria-hidden />
          </button>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="outline" size="md" onClick={() => void finish(false)} disabled={busy}>
              <X className="size-4" aria-hidden />
              {t('onboarding.yaEntrenoAqui')}
            </Button>
            <Button size="md" onClick={() => void finish(true)} disabled={busy || !suggested || !state.acceptedTerms}>
              <Play className="size-4" fill="currentColor" aria-hidden />
              {t('onboarding.empezarD1')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
