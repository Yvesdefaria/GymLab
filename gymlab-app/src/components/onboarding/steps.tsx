// Pasos del wizard de onboarding. Cada paso es un componente de presentación que
// recibe el estado compartido y un patch para actualizarlo (el estado vive en
// Onboarding.tsx). El idioma es el primer paso por petición del usuario.
import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  HEIGHT_RANGE,
  isBirthDateValid,
  MATERIALS,
  type AppLanguage,
  WEIGHT_RANGE,
} from '@/domain/onboarding'
import type { I18nKey } from '@/i18n'
import { toLocalDateStr } from '@/domain/dates'
import { applyUnits, parseWeightToKg } from '@/domain/settings'
import type { GuideCategory, Level, Objective, Routine, Sex } from '@/domain/types'

export interface OnboardingState {
  language: AppLanguage | null
  objective: Objective | null
  level: Level
  daysPerWeek: number | null
  material: string | null
  sessionDurationMin: number
  cardioPerWeek: number
  units: 'kg' | 'lb'
  sex: Sex | null
  birthDate: string
  heightCm: string
  weightKg: string
  guideInterests: string[]
  acceptedTerms: boolean
}

// Lista blanca de lugares de entrenamiento: el finish solo guarda valores de aquí.

const DAYS_OPTS = [2, 3, 4, 5]
const DURATION_OPTS = [30, 45, 60, 90]
const CARDIO_OPTS = [0, 1, 2, 3]

const OBJECTIVES: { value: Objective; labelKey: I18nKey }[] = [
  { value: 'fuerza', labelKey: 'onboarding.objFuerza' },
  { value: 'volumen', labelKey: 'onboarding.objVolumen' },
  { value: 'definicion', labelKey: 'onboarding.objDefinicion' },
  { value: 'resistencia', labelKey: 'onboarding.objResistencia' },
  { value: 'general', labelKey: 'onboarding.objGeneral' },
]

const LEVELS: { value: Level; labelKey: I18nKey }[] = [
  { value: 'principiante', labelKey: 'onboarding.nivelPrincipiante' },
  { value: 'intermedio', labelKey: 'onboarding.nivelIntermedio' },
  { value: 'avanzado', labelKey: 'onboarding.nivelAvanzado' },
]

const GUIDE_OPTIONS: { value: GuideCategory; labelKey: I18nKey }[] = [
  { value: 'entrenamiento', labelKey: 'onboarding.interesEntrenamiento' },
  { value: 'nutricion', labelKey: 'onboarding.interesNutricion' },
  { value: 'dietas', labelKey: 'onboarding.interesDietas' },
  { value: 'suplementos', labelKey: 'onboarding.interesSuplementos' },
  { value: 'mujer', labelKey: 'onboarding.interesMujer' },
  { value: 'recuperacion', labelKey: 'onboarding.interesRecuperacion' },
]

// Rangos plausibles para validar los datos del perfil antes de continuar.

interface StepProps {
  state: OnboardingState
  onChange: (patch: Partial<OnboardingState>) => void
}

// Chip seleccionable: la única fuente de valores cerrados (objetivo, días, material…).
const Chip = ({ selected, onSelect, children, className = '' }: { selected: boolean; onSelect: () => void; children: ReactNode; className?: string }) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onSelect}
    className={`min-h-[44px] rounded-xl border px-3 text-sm font-medium transition-colors ${
      selected ? 'border-cta bg-cta/20 text-accent-soft' : 'border-border text-muted hover:border-cta'
    } ${className}`}
  >
    {children}
  </button>
)

const Kicker = ({ children }: { children: ReactNode }) => <p className="mt-4 kicker">{children}</p>

// Paso 1 — Idioma.
export const LanguageStep = ({ state, onChange }: StepProps) => {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-fg">{t('onboarding.idiomaTitulo')}</h1>
      <p className="mt-1 text-sm text-muted">{t('onboarding.idiomaDescripcion')}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Chip selected={state.language === 'es'} onSelect={() => onChange({ language: 'es' })} className="min-h-[52px]">
          {t('onboarding.idiomaEspanol')}
        </Chip>
        <Chip selected={state.language === 'en'} onSelect={() => onChange({ language: 'en' })} className="min-h-[52px]">
          {t('onboarding.idiomaIngles')}
        </Chip>
      </div>
    </div>
  )
}

// Paso 2 — Objetivo y nivel.
export const ObjectiveStep = ({ state, onChange }: StepProps) => {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-fg">{t('onboarding.objetivoTitulo')}</h1>
      <p className="mt-1 text-sm text-muted">{t('onboarding.objetivoDescripcion')}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {OBJECTIVES.map((o) => (
          <Chip key={o.value} selected={state.objective === o.value} onSelect={() => onChange({ objective: o.value })} className="min-h-[52px]">
            {t(o.labelKey)}
          </Chip>
        ))}
      </div>
      <Kicker>{t('onboarding.nivel')}</Kicker>
      <div className="mt-2 flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <Chip key={l.value} selected={state.level === l.value} onSelect={() => onChange({ level: l.value })}>
            {t(l.labelKey)}
          </Chip>
        ))}
      </div>
    </div>
  )
}

// Paso 3 — Semana: días, duración, cardio y lugar de entrenamiento.
export const WeekStep = ({ state, onChange }: StepProps) => {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-fg">{t('onboarding.semanaTitulo')}</h1>
      <p className="mt-1 text-sm text-muted">{t('onboarding.semanaDescripcion')}</p>
      <Kicker>{t('onboarding.diasSemana')}</Kicker>
      <div className="mt-2 flex gap-2">
        {DAYS_OPTS.map((d) => (
          <Chip key={d} selected={state.daysPerWeek === d} onSelect={() => onChange({ daysPerWeek: d })} className="flex-1">
            {d}
          </Chip>
        ))}
      </div>
      <Kicker>{t('onboarding.duracionSesion')}</Kicker>
      <div className="mt-2 flex flex-wrap gap-2">
        {DURATION_OPTS.map((m) => (
          <Chip key={m} selected={state.sessionDurationMin === m} onSelect={() => onChange({ sessionDurationMin: m })}>
            {m} min
          </Chip>
        ))}
      </div>
      <Kicker>{t('onboarding.cardio')}</Kicker>
      <div className="mt-2 flex flex-wrap gap-2">
        {CARDIO_OPTS.map((n) => (
          <Chip key={n} selected={state.cardioPerWeek === n} onSelect={() => onChange({ cardioPerWeek: n })}>
            {n}
          </Chip>
        ))}
      </div>
      <Kicker>{t('onboarding.lugarEntreno')}</Kicker>
      <div className="mt-2 flex flex-wrap gap-2">
        {MATERIALS.map((m) => (
          <Chip key={m} selected={state.material === m} onSelect={() => onChange({ material: m })}>
            {m}
          </Chip>
        ))}
      </div>
    </div>
  )
}

// Paso 4 — Perfil: unidades, sexo, fecha de nacimiento, altura y peso.
export const ProfileStep = ({ state, onChange }: StepProps) => {
  const { t } = useTranslation()
  const showBirthError = state.birthDate !== '' && !isBirthDateValid(state.birthDate)
  const heightNum = Number(state.heightCm)
  const showHeightError =
    state.heightCm !== '' && (state.heightCm === '0' || !Number.isFinite(heightNum) || heightNum < HEIGHT_RANGE.min || heightNum > HEIGHT_RANGE.max)
  const weightNum = Number(state.weightKg)
  // El peso se teclea en la unidad elegida y se valida siempre en kg (rango 30–300).
  const weightKg = weightNum > 0 ? parseWeightToKg(weightNum, state.units) : 0
  const showWeightError =
    state.weightKg !== '' && (state.weightKg === '0' || !Number.isFinite(weightNum) || weightKg < WEIGHT_RANGE.min || weightKg > WEIGHT_RANGE.max)
  const inputCls =
    'h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none'
  // Al cambiar de unidad se convierte el valor ya tecleado para no perder la medida.
  const switchUnits = (next: 'kg' | 'lb') => {
    if (next === state.units) return
    const num = Number(state.weightKg)
    if (state.weightKg === '' || !Number.isFinite(num)) {
      onChange({ units: next })
      return
    }
    const valueKg = parseWeightToKg(num, state.units)
    const shown = next === 'lb' ? applyUnits(valueKg, 'lb') : valueKg
    onChange({ units: next, weightKg: String(Math.round(shown * 10) / 10) })
  }
  const weightUnit = state.units === 'lb' ? 'lb' : 'kg'
  const weightMin = Math.round(applyUnits(WEIGHT_RANGE.min, state.units))
  const weightMax = Math.round(applyUnits(WEIGHT_RANGE.max, state.units))
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-fg">{t('onboarding.perfilTitulo')}</h1>
      <p className="mt-1 text-sm text-muted">{t('onboarding.perfilDescripcion')}</p>
      <Kicker>{t('onboarding.unidadesPeso')}</Kicker>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Chip selected={state.units === 'kg'} onSelect={() => switchUnits('kg')}>
          {t('onboarding.kg')}
        </Chip>
        <Chip selected={state.units === 'lb'} onSelect={() => switchUnits('lb')}>
          {t('onboarding.lb')}
        </Chip>
      </div>
      <Kicker>{t('onboarding.sexo')}</Kicker>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Chip selected={state.sex === 'male'} onSelect={() => onChange({ sex: 'male' })}>
          {t('onboarding.hombre')}
        </Chip>
        <Chip selected={state.sex === 'female'} onSelect={() => onChange({ sex: 'female' })}>
          {t('onboarding.mujer')}
        </Chip>
      </div>
      <Kicker>{t('onboarding.fechaNacimiento')}</Kicker>
      <input
        type="date"
        value={state.birthDate}
        max={toLocalDateStr()}
        onChange={(e) => onChange({ birthDate: e.target.value })}
        aria-label={t('onboarding.fechaNacimiento')}
        className={`mt-2 ${inputCls}`}
      />
      {showBirthError && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {t('onboarding.edadError')}
        </p>
      )}
      <Kicker>{t('onboarding.altura')}</Kicker>
      <input
        type="number"
        inputMode="decimal"
        min={HEIGHT_RANGE.min}
        max={HEIGHT_RANGE.max}
        value={state.heightCm}
        onChange={(e) => onChange({ heightCm: e.target.value })}
        placeholder={t('onboarding.ejemplo', { valor: '175' })}
        aria-label={t('onboarding.alturaCm')}
        className={`mt-2 ${inputCls}`}
      />
      {showHeightError && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {t('onboarding.alturaError', { min: HEIGHT_RANGE.min, max: HEIGHT_RANGE.max })}
        </p>
      )}
      <Kicker>{t('onboarding.peso')}</Kicker>
      <input
        type="number"
        inputMode="decimal"
        min={weightMin}
        max={weightMax}
        value={state.weightKg}
        onChange={(e) => onChange({ weightKg: e.target.value })}
        placeholder={t('onboarding.ejemplo', { valor: state.units === 'lb' ? '165' : '75' })}
        aria-label={t('onboarding.pesoEn', { unidad: weightUnit })}
        className={`mt-2 ${inputCls}`}
      />
      {showWeightError && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {t('onboarding.pesoError', { min: weightMin, max: weightMax, unidad: weightUnit })}
        </p>
      )}
    </div>
  )
}

// Paso 5 — Resumen: intereses de guías, términos y rutina sugerida.
export const SummaryStep = ({ state, onChange, suggested }: StepProps & { suggested: Routine | undefined }) => {
  const { t } = useTranslation()
  const toggleInterest = (v: GuideCategory) =>
    onChange({
      guideInterests: state.guideInterests.includes(v)
        ? state.guideInterests.filter((i) => i !== v)
        : [...state.guideInterests, v],
    })
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-fg">{t('onboarding.resumenTitulo')}</h1>
      <p className="mt-1 text-sm text-muted">{t('onboarding.resumenDescripcion')}</p>
      {suggested ? (
        <div className="mt-4 rounded-2xl border border-cta/40 bg-cta/10 p-4">
          <p className="font-display text-base font-semibold text-accent-soft">{suggested.title}</p>
          <p className="mt-1 text-xs capitalize text-muted">
            {suggested.level} · {t('onboarding.dias', { count: suggested.daysCount })} · {suggested.objective}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-fg">{suggested.description}</p>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-gold/40 p-4 text-sm text-muted">
          {t('onboarding.sinRutina')}
        </p>
      )}
      <Kicker>{t('onboarding.intereses')}</Kicker>
      <div className="mt-2 flex flex-wrap gap-2">
        {GUIDE_OPTIONS.map((g) => (
          <Chip key={g.value} selected={state.guideInterests.includes(g.value)} onSelect={() => toggleInterest(g.value)}>
            {t(g.labelKey)}
          </Chip>
        ))}
      </div>
      <label className="mt-5 flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:border-cta">
        <input
          type="checkbox"
          checked={state.acceptedTerms}
          onChange={(e) => onChange({ acceptedTerms: e.target.checked })}
          className="mt-0.5 size-5 accent-cta"
        />
        <span className="text-sm text-muted">
          <Trans i18nKey="onboarding.terminos">
            He leído y acepto los <span className="text-accent-soft">términos de uso</span> y la{' '}
            <span className="text-accent-soft">política de privacidad</span> de GymLab.
          </Trans>
        </span>
      </label>
    </div>
  )
}
