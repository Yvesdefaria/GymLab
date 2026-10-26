// Pasos del wizard de onboarding (F132.9): una decisión por pantalla.
// Cada paso es presentación pura: recibe el estado compartido y un patch.
// El shell (barra, progreso y CTA) vive en OnboardingWizard.
import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  HEIGHT_RANGE,
  isBirthDateValid,
  MATERIAL_BUCKETS,
  MATERIAL_PRESETS,
  ONBOARDING_DAYS_OPTIONS,
  type AppLanguage,
  type MaterialBucket,
  WEIGHT_RANGE,
} from '@/domain/onboarding'
import { NAME_MAX_LENGTH } from '@/domain/profileMeta'
import type { I18nKey } from '@/i18n'
import { localizeExercise, localizeMuscleGroup } from '@/i18n/catalog'
import type { RoutinePlan } from '@/domain/routineResolution'
import { toLocalDateStr } from '@/domain/dates'
import { applyUnits, parseWeightToKg } from '@/domain/settings'
import type { Exercise, GuideCategory, Level, MuscleGroup, Objective, Sex } from '@/domain/types'
import { LEVELS, OBJECTIVES } from '@/domain/catalog'
import { EquipmentFilter } from '@/components/equipment/EquipmentFilter'
import { PlanCoverageNote } from '@/components/routines/PlanCoverageNote'
import { PlanPreview } from '@/components/routines/PlanPreview'
import { DecimalInput } from '@/components/ui/DecimalInput'
import { useEquipmentStore } from '@/store/equipmentStore'

export interface OnboardingState {
  language: AppLanguage | null
  name: string
  objective: Objective | null
  level: Level
  daysPerWeek: number | null
  materialBucket: MaterialBucket | null
  sessionDurationMin: number
  cardioPerWeek: number
  units: 'kg' | 'lb'
  sex: Sex | null
  birthDate: string
  heightCm: number | undefined
  weightKg: number | undefined
  guideInterests: string[]
  acceptedTerms: boolean
}

const DURATION_OPTS = [30, 45, 60, 90]
const CARDIO_OPTS = [0, 1, 2, 3]

const OBJECTIVE_LABEL_KEYS: Record<Objective, I18nKey> = {
  fuerza: 'onboarding.objFuerza',
  volumen: 'onboarding.objVolumen',
  definicion: 'onboarding.objDefinicion',
  resistencia: 'onboarding.objResistencia',
  general: 'onboarding.objGeneral',
}

const LEVEL_LABEL_KEYS: Record<Level, I18nKey> = {
  principiante: 'onboarding.nivelPrincipiante',
  intermedio: 'onboarding.nivelIntermedio',
  avanzado: 'onboarding.nivelAvanzado',
}

const BUCKET_LABEL_KEYS: Record<MaterialBucket, I18nKey> = {
  Gimnasio: 'onboarding.materialPresetGimnasio',
  'Mancuernas en casa': 'onboarding.materialPresetMancuernas',
  'Solo peso corporal': 'onboarding.materialPresetPesoCorporal',
  'Lo que sea': 'onboarding.materialPresetLoQueSea',
}

const BUCKET_DESC_KEYS: Record<MaterialBucket, I18nKey> = {
  Gimnasio: 'onboarding.materialGimnasioDesc',
  'Mancuernas en casa': 'onboarding.materialMancuernasDesc',
  'Solo peso corporal': 'onboarding.materialPesoCorporalDesc',
  'Lo que sea': 'onboarding.materialLoQueSeaDesc',
}

const GUIDE_OPTIONS: { value: GuideCategory; labelKey: I18nKey }[] = [
  { value: 'entrenamiento', labelKey: 'onboarding.interesEntrenamiento' },
  { value: 'nutricion', labelKey: 'onboarding.interesNutricion' },
  { value: 'dietas', labelKey: 'onboarding.interesDietas' },
  { value: 'suplementos', labelKey: 'onboarding.interesSuplementos' },
  { value: 'mujer', labelKey: 'onboarding.interesMujer' },
  { value: 'recuperacion', labelKey: 'onboarding.interesRecuperacion' },
  { value: 'leyenda', labelKey: 'onboarding.interesLeyenda' },
]

interface StepProps {
  state: OnboardingState
  onChange: (patch: Partial<OnboardingState>) => void
}

// Título + una línea de contexto. El shell ya puso el progreso arriba.
export const StepHeading = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div>
    <h1 className="font-display text-3xl font-light leading-tight tracking-tight text-fg">{title}</h1>
    <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
  </div>
)

// Fila hairline de opción única con radio visual. aria-pressed mantiene el
// contrato simple de botón; el grupo se anuncia con role="radiogroup".
const ChoiceRow = ({
  selected,
  onSelect,
  children,
  hint,
}: {
  selected: boolean
  onSelect: () => void
  children: ReactNode
  hint?: string
}) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onSelect}
    className="flex min-h-14 w-full items-center gap-3 border-b border-border/30 py-3 text-left text-[15px] text-fg transition-colors last:border-b-0"
  >
    <span
      aria-hidden
      className={`grid size-5 shrink-0 place-items-center rounded-full border ${
        selected ? 'border-cta' : 'border-border'
      }`}
    >
      {selected && <span className="size-2.5 rounded-full bg-cta" />}
    </span>
    <span className="min-w-0 flex-1">{children}</span>
    {hint && <span className="shrink-0 text-[10px] tracking-wide text-muted">{hint}</span>}
  </button>
)

const ChoiceGroup = ({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) => (
  <div role="group" aria-label={label} className="mt-2">
    {children}
  </div>
)

// Segmentado compacto para valores cortos (días, duración, cardio, unidades).
const Segmented = <T extends number | string>({
  label,
  options,
  value,
  onChange,
  format = (item) => String(item),
}: {
  label: string
  options: readonly T[]
  value: T | ''
  onChange: (value: T) => void
  format?: (value: T) => string
}) => (
  <div role="group" aria-label={label} className="mt-2 flex gap-1.5">
    {options.map((option) => {
      const selected = option === value
      return (
        <button
          key={String(option)}
          type="button"
          aria-pressed={selected}
          onClick={() => onChange(option)}
          className={`min-h-11 flex-1 rounded-lg border px-2 text-[13px] tabular-nums transition-colors ${
            selected
              ? 'border-cta bg-cta/10 font-semibold text-gold-bright'
              : 'border-border text-muted'
          }`}
        >
          {format(option)}
        </button>
      )
    })}
  </div>
)

const Kicker = ({ children }: { children: ReactNode }) => (
  <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{children}</p>
)

const fieldClass =
  'mt-2 h-11 w-full border-b border-border/60 bg-transparent px-0 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none'

// Paso 1 — Idioma.
export const LanguageStep = ({ state, onChange }: StepProps) => {
  const { t } = useTranslation()
  return (
    <div>
      <StepHeading title={t('onboarding.idiomaTitulo')} subtitle={t('onboarding.idiomaDescripcion')} />
      <ChoiceGroup label={t('onboarding.stepIdioma')}>
        <ChoiceRow selected={state.language === 'es'} onSelect={() => onChange({ language: 'es' })}>
          {t('onboarding.idiomaEspanol')}
        </ChoiceRow>
        <ChoiceRow selected={state.language === 'en'} onSelect={() => onChange({ language: 'en' })}>
          {t('onboarding.idiomaIngles')}
        </ChoiceRow>
      </ChoiceGroup>
    </div>
  )
}

// Paso 2 — Objetivo y nivel (la única pantalla con dos decisiones).
export const ObjectiveStep = ({ state, onChange }: StepProps) => {
  const { t } = useTranslation()
  return (
    <div>
      <StepHeading title={t('onboarding.objetivoTitulo')} subtitle={t('onboarding.objetivoDescripcion')} />
      <ChoiceGroup label={t('onboarding.objetivoTitulo')}>
        {OBJECTIVES.map((objective) => (
          <ChoiceRow
            key={objective}
            selected={state.objective === objective}
            onSelect={() => onChange({ objective })}
          >
            {t(OBJECTIVE_LABEL_KEYS[objective])}
          </ChoiceRow>
        ))}
      </ChoiceGroup>
      <Kicker>{t('onboarding.nivel')}</Kicker>
      <ChoiceGroup label={t('onboarding.nivel')}>
        {LEVELS.map((level) => (
          <ChoiceRow key={level} selected={state.level === level} onSelect={() => onChange({ level })}>
            {t(LEVEL_LABEL_KEYS[level])}
          </ChoiceRow>
        ))}
      </ChoiceGroup>
    </div>
  )
}

// Paso 3 — Días por semana.
export const DaysStep = ({ state, onChange }: StepProps) => {
  const { t } = useTranslation()
  return (
    <div>
      <StepHeading title={t('onboarding.diasTitulo')} subtitle={t('onboarding.diasDescripcion')} />
      <ChoiceGroup label={t('onboarding.diasTitulo')}>
        {ONBOARDING_DAYS_OPTIONS.map((days) => (
          <ChoiceRow
            key={days}
            selected={state.daysPerWeek === days}
            onSelect={() => onChange({ daysPerWeek: days })}
            hint={days === 3 ? t('onboarding.diasRecomendado') : days === 4 ? t('onboarding.diasEquilibrio') : undefined}
          >
            {t('onboarding.dias', { count: days })}
          </ChoiceRow>
        ))}
      </ChoiceGroup>
    </div>
  )
}

// Paso 4 — Duración, cardio y equipamiento.
export const SessionStep = ({ state, onChange }: StepProps) => {
  const { t } = useTranslation()
  const setSelected = useEquipmentStore((s) => s.setSelected)
  return (
    <div>
      <StepHeading title={t('onboarding.sesionTitulo')} subtitle={t('onboarding.sesionDescripcion')} />
      <Kicker>{t('onboarding.duracionSesion')}</Kicker>
      <Segmented
        label={t('onboarding.duracionSesion')}
        options={DURATION_OPTS}
        value={state.sessionDurationMin}
        onChange={(value) => onChange({ sessionDurationMin: value })}
        format={(value) => `${value} min`}
      />
      <Kicker>{t('onboarding.cardio')}</Kicker>
      <Segmented
        label={t('onboarding.cardio')}
        options={CARDIO_OPTS}
        value={state.cardioPerWeek}
        onChange={(value) => onChange({ cardioPerWeek: value })}
      />
      <Kicker>{t('onboarding.equipamientoTitulo')}</Kicker>
      <p className="mt-1 text-xs leading-relaxed text-muted">{t('onboarding.equipamientoDescripcion')}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {MATERIAL_BUCKETS.map((bucket) => {
          const selected = state.materialBucket === bucket
          return (
            <button
              key={bucket}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                // El preset siembra el equipamiento; los chips de abajo afinan. Una sola verdad.
                setSelected(MATERIAL_PRESETS[bucket])
                onChange({ materialBucket: bucket })
              }}
              className={`min-h-[58px] rounded-xl border px-3 py-2 text-left transition-colors ${
                selected ? 'border-cta bg-cta/10' : 'border-border'
              }`}
            >
              <span className="block text-[12.5px] font-medium leading-tight text-fg">
                {t(BUCKET_LABEL_KEYS[bucket])}
              </span>
              <span className="mt-0.5 block text-[10px] leading-tight text-muted">
                {t(BUCKET_DESC_KEYS[bucket])}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-3">
        <EquipmentFilter />
      </div>
    </div>
  )
}

// Paso 5 — Identidad: nombre, unidades y sexo.
export const IdentityStep = ({ state, onChange }: StepProps) => {
  const { t } = useTranslation()
  const switchUnits = (next: 'kg' | 'lb') => {
    if (next === state.units) return
    const value = state.weightKg
    if (value === undefined || !Number.isFinite(value)) {
      onChange({ units: next })
      return
    }
    const valueKg = parseWeightToKg(value, state.units)
    const shown = next === 'lb' ? applyUnits(valueKg, 'lb') : valueKg
    onChange({ units: next, weightKg: Math.round(shown * 10) / 10 })
  }
  return (
    <div>
      <StepHeading title={t('onboarding.identidadTitulo')} subtitle={t('onboarding.identidadDescripcion')} />
      <Kicker>{t('onboarding.nombre')}</Kicker>
      <input
        type="text"
        value={state.name}
        maxLength={NAME_MAX_LENGTH}
        autoComplete="name"
        placeholder={t('onboarding.nombreEjemplo')}
        aria-label={t('onboarding.nombre')}
        onChange={(e) => onChange({ name: e.target.value })}
        className={fieldClass}
      />
      <Kicker>{t('onboarding.unidadesPeso')}</Kicker>
      <Segmented
        label={t('onboarding.unidadesPeso')}
        options={['kg', 'lb'] as const}
        value={state.units}
        onChange={(value) => switchUnits(value)}
        format={(value) => (value === 'kg' ? t('onboarding.kg') : t('onboarding.lb'))}
      />
      <Kicker>{t('onboarding.sexo')}</Kicker>
      <Segmented
        label={t('onboarding.sexo')}
        options={['male', 'female'] as const}
        value={state.sex ?? ''}
        onChange={(value) => onChange({ sex: value })}
        format={(value) => (value === 'male' ? t('onboarding.hombre') : t('onboarding.mujer'))}
      />
    </div>
  )
}

// Paso 6 — Medidas: fecha, altura y peso.
export const MeasurementsStep = ({ state, onChange }: StepProps) => {
  const { t } = useTranslation()
  const showBirthError = state.birthDate !== '' && !isBirthDateValid(state.birthDate)
  const heightNum = state.heightCm ?? Number.NaN
  const showHeightError =
    state.heightCm !== undefined &&
    (state.heightCm === 0 || !Number.isFinite(heightNum) || heightNum < HEIGHT_RANGE.min || heightNum > HEIGHT_RANGE.max)
  const weightNum = state.weightKg ?? Number.NaN
  const weightKg = weightNum > 0 ? parseWeightToKg(weightNum, state.units) : 0
  const showWeightError =
    state.weightKg !== undefined &&
    (state.weightKg === 0 || !Number.isFinite(weightNum) || weightKg < WEIGHT_RANGE.min || weightKg > WEIGHT_RANGE.max)
  const weightUnit = state.units === 'lb' ? 'lb' : 'kg'
  const weightMin = Math.round(applyUnits(WEIGHT_RANGE.min, state.units))
  const weightMax = Math.round(applyUnits(WEIGHT_RANGE.max, state.units))
  return (
    <div>
      <StepHeading title={t('onboarding.medidasTitulo')} subtitle={t('onboarding.medidasDescripcion')} />
      <Kicker>{t('onboarding.fechaNacimiento')}</Kicker>
      <input
        type="date"
        value={state.birthDate}
        max={toLocalDateStr()}
        onChange={(e) => onChange({ birthDate: e.target.value })}
        aria-label={t('onboarding.fechaNacimiento')}
        className={fieldClass}
      />
      {showBirthError && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {t('onboarding.edadError')}
        </p>
      )}
      <Kicker>{t('onboarding.altura')}</Kicker>
      <DecimalInput
        value={state.heightCm}
        onChange={(v) => onChange({ heightCm: v })}
        placeholder={t('onboarding.ejemplo', { valor: '175' })}
        ariaLabel={t('onboarding.alturaCm')}
        className={fieldClass}
      />
      {showHeightError && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {t('onboarding.alturaError', { min: HEIGHT_RANGE.min, max: HEIGHT_RANGE.max })}
        </p>
      )}
      <Kicker>{t('onboarding.peso')}</Kicker>
      <DecimalInput
        value={state.weightKg}
        onChange={(v) => onChange({ weightKg: v })}
        placeholder={t('onboarding.ejemplo', { valor: state.units === 'lb' ? '165' : '75' })}
        ariaLabel={t('onboarding.pesoEn', { unidad: weightUnit })}
        className={fieldClass}
      />
      {showWeightError && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {t('onboarding.pesoError', { min: weightMin, max: weightMax, unidad: weightUnit })}
        </p>
      )}
    </div>
  )
}

// Paso 7 — Resumen: plan, intereses y términos.
export const SummaryStep = ({
  state,
  onChange,
  plan,
  exerciseById,
}: StepProps & { plan: RoutinePlan | undefined; exerciseById: ReadonlyMap<number, Exercise> }) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const toggleInterest = (v: GuideCategory) =>
    onChange({
      guideInterests: state.guideInterests.includes(v)
        ? state.guideInterests.filter((i) => i !== v)
        : [...state.guideInterests, v],
    })
  const exerciseName = (id: number) => {
    const exercise = exerciseById.get(id)
    return exercise ? localizeExercise(exercise, lang).name : t('planner.exerciseFallback', { id })
  }
  const muscleLabel = (group: MuscleGroup) => localizeMuscleGroup(group, lang)
  return (
    <div>
      <StepHeading title={t('onboarding.resumenTitulo')} subtitle={t('onboarding.resumenDescripcion')} />
      {plan ? (
        <div className="mt-5 border-t border-border/40 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            {t('onboarding.planTitulo')}
          </p>
          <p className="mt-1 font-display text-lg font-light text-fg">{plan.title}</p>
          <p className="mt-0.5 text-xs text-muted">
            {t(plan.source === 'predefined' ? 'onboarding.planPredefinido' : 'onboarding.planGenerado')}
          </p>
          {plan.days.length === 0 ? (
            <p role="alert" className="mt-3 text-sm text-danger">
              {t('onboarding.planVacio')}
            </p>
          ) : (
            <div className="mt-3">
              <PlanPreview
                plan={plan}
                exerciseName={exerciseName}
                exerciseGroup={(id) => exerciseById.get(id)?.muscleGroup}
                muscleLabel={muscleLabel}
              />
            </div>
          )}
        </div>
      ) : (
        <p className="mt-5 border-t border-border/40 pt-3 text-sm text-muted">{t('onboarding.sinRutina')}</p>
      )}
      {plan ? (
        <div className="mt-3">
          <PlanCoverageNote omittedGroups={plan.coverage.omittedGroups.map(muscleLabel)} droppedDays={plan.coverage.droppedDays} />
        </div>
      ) : null}
      <Kicker>{t('onboarding.intereses')}</Kicker>
      <div className="mt-2 flex flex-wrap gap-2">
        {GUIDE_OPTIONS.map((guide) => {
          const selected = state.guideInterests.includes(guide.value)
          return (
            <button
              key={guide.value}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleInterest(guide.value)}
              className={`min-h-11 rounded-full border px-3 text-[11px] transition-colors ${
                selected ? 'border-cta bg-cta/10 text-gold-bright' : 'border-border/60 text-muted'
              }`}
            >
              {t(guide.labelKey)}
            </button>
          )
        })}
      </div>
      <label className="mt-5 flex min-h-11 cursor-pointer items-start gap-3 border-t border-border/40 pt-3">
        <input
          type="checkbox"
          checked={state.acceptedTerms}
          onChange={(e) => onChange({ acceptedTerms: e.target.checked })}
          className="mt-0.5 size-5 accent-cta"
        />
        <span className="text-sm text-muted">
          <Trans i18nKey="onboarding.terminos">
            He leído y acepto los <Link to="/terminos" className="text-accent-soft underline">términos de uso</Link> y la{' '}
            <Link to="/privacidad" className="text-accent-soft underline">política de privacidad</Link> de GymLab.
          </Trans>
        </span>
      </label>
      <p className="mt-3 text-xs text-muted">{t('onboarding.telemetryAviso')}</p>
    </div>
  )
}
