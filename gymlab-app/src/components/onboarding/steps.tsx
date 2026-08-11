// Pasos del wizard de onboarding. Cada paso es un componente de presentación que
// recibe el estado compartido y un patch para actualizarlo (el estado vive en
// Onboarding.tsx). El idioma es el primer paso por petición del usuario.
import type { ReactNode } from 'react'
import { isBirthDateValid, type AppLanguage } from '@/domain/onboarding'
import { toLocalDateStr } from '@/domain/dates'
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
export const MATERIALS = ['Gimnasio', 'Mancuernas en casa', 'Solo peso corporal', 'Lo que sea']

const DAYS_OPTS = [2, 3, 4, 5]
const DURATION_OPTS = [30, 45, 60, 90]
const CARDIO_OPTS = [0, 1, 2, 3]

const OBJECTIVES: { value: Objective; label: string }[] = [
  { value: 'fuerza', label: 'Fuerza' },
  { value: 'volumen', label: 'Ganar masa' },
  { value: 'definicion', label: 'Definirme' },
  { value: 'resistencia', label: 'Resistencia' },
  { value: 'general', label: 'General' },
]

const LEVELS: { value: Level; label: string }[] = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
]

const GUIDE_OPTIONS: { value: GuideCategory; label: string }[] = [
  { value: 'entrenamiento', label: 'Entrenamiento' },
  { value: 'nutricion', label: 'Nutrición' },
  { value: 'dietas', label: 'Dietas' },
  { value: 'suplementos', label: 'Suplementos' },
  { value: 'mujer', label: 'Mujer' },
  { value: 'recuperacion', label: 'Recuperación' },
]

// Rangos plausibles para validar los datos del perfil antes de continuar.
export const HEIGHT_RANGE = { min: 100, max: 250 }
export const WEIGHT_RANGE = { min: 30, max: 300 }

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
export const LanguageStep = ({ state, onChange }: StepProps) => (
  <div>
    <h1 className="font-display text-2xl font-bold text-fg">¿En qué idioma prefieres la app?</h1>
    <p className="mt-1 text-sm text-muted">Elige el idioma de tu experiencia.</p>
    <div className="mt-4 grid grid-cols-2 gap-2">
      <Chip selected={state.language === 'es'} onSelect={() => onChange({ language: 'es' })} className="min-h-[52px]">
        Español
      </Chip>
      <Chip selected={state.language === 'en'} onSelect={() => onChange({ language: 'en' })} className="min-h-[52px]">
        English
      </Chip>
    </div>
  </div>
)

// Paso 2 — Objetivo y nivel.
export const ObjectiveStep = ({ state, onChange }: StepProps) => (
  <div>
    <h1 className="font-display text-2xl font-bold text-fg">¿Qué quieres lograr?</h1>
    <p className="mt-1 text-sm text-muted">Elige tu objetivo principal para empezar.</p>
    <div className="mt-4 grid grid-cols-2 gap-2">
      {OBJECTIVES.map((o) => (
        <Chip key={o.value} selected={state.objective === o.value} onSelect={() => onChange({ objective: o.value })} className="min-h-[52px]">
          {o.label}
        </Chip>
      ))}
    </div>
    <Kicker>Tu nivel</Kicker>
    <div className="mt-2 flex flex-wrap gap-2">
      {LEVELS.map((l) => (
        <Chip key={l.value} selected={state.level === l.value} onSelect={() => onChange({ level: l.value })}>
          {l.label}
        </Chip>
      ))}
    </div>
  </div>
)

// Paso 3 — Semana: días, duración, cardio y lugar de entrenamiento.
export const WeekStep = ({ state, onChange }: StepProps) => (
  <div>
    <h1 className="font-display text-2xl font-bold text-fg">Tu semana</h1>
    <p className="mt-1 text-sm text-muted">Días, duración y dónde entrenas.</p>
    <Kicker>Días por semana</Kicker>
    <div className="mt-2 flex gap-2">
      {DAYS_OPTS.map((d) => (
        <Chip key={d} selected={state.daysPerWeek === d} onSelect={() => onChange({ daysPerWeek: d })} className="flex-1">
          {d}
        </Chip>
      ))}
    </div>
    <Kicker>Duración por sesión</Kicker>
    <div className="mt-2 flex flex-wrap gap-2">
      {DURATION_OPTS.map((m) => (
        <Chip key={m} selected={state.sessionDurationMin === m} onSelect={() => onChange({ sessionDurationMin: m })}>
          {m} min
        </Chip>
      ))}
    </div>
    <Kicker>Cardio extra (días/semana)</Kicker>
    <div className="mt-2 flex flex-wrap gap-2">
      {CARDIO_OPTS.map((n) => (
        <Chip key={n} selected={state.cardioPerWeek === n} onSelect={() => onChange({ cardioPerWeek: n })}>
          {n}
        </Chip>
      ))}
    </div>
    <Kicker>Lugar de entrenamiento</Kicker>
    <div className="mt-2 flex flex-wrap gap-2">
      {MATERIALS.map((m) => (
        <Chip key={m} selected={state.material === m} onSelect={() => onChange({ material: m })}>
          {m}
        </Chip>
      ))}
    </div>
  </div>
)

// Paso 4 — Perfil: unidades, sexo, fecha de nacimiento, altura y peso.
export const ProfileStep = ({ state, onChange }: StepProps) => {
  const showBirthError = state.birthDate !== '' && !isBirthDateValid(state.birthDate)
  const heightNum = Number(state.heightCm)
  const showHeightError =
    state.heightCm !== '' && (state.heightCm === '0' || !Number.isFinite(heightNum) || heightNum < HEIGHT_RANGE.min || heightNum > HEIGHT_RANGE.max)
  const weightNum = Number(state.weightKg)
  const showWeightError =
    state.weightKg !== '' && (state.weightKg === '0' || !Number.isFinite(weightNum) || weightNum < WEIGHT_RANGE.min || weightNum > WEIGHT_RANGE.max)
  const inputCls =
    'h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none'
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-fg">Tu perfil</h1>
      <p className="mt-1 text-sm text-muted">Datos para tus métricas y calculadoras.</p>
      <Kicker>Unidades de peso</Kicker>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Chip selected={state.units === 'kg'} onSelect={() => onChange({ units: 'kg' })}>
          Kilogramos (kg)
        </Chip>
        <Chip selected={state.units === 'lb'} onSelect={() => onChange({ units: 'lb' })}>
          Libras (lb)
        </Chip>
      </div>
      <Kicker>Sexo</Kicker>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Chip selected={state.sex === 'male'} onSelect={() => onChange({ sex: 'male' })}>
          Hombre
        </Chip>
        <Chip selected={state.sex === 'female'} onSelect={() => onChange({ sex: 'female' })}>
          Mujer
        </Chip>
      </div>
      <Kicker>Fecha de nacimiento</Kicker>
      <input
        type="date"
        value={state.birthDate}
        max={toLocalDateStr()}
        onChange={(e) => onChange({ birthDate: e.target.value })}
        aria-label="Fecha de nacimiento"
        className={`mt-2 ${inputCls}`}
      />
      {showBirthError && (
        <p role="alert" className="mt-2 text-xs text-danger">
          Debes tener entre 14 y 99 años para usar GymLab.
        </p>
      )}
      <Kicker>Altura</Kicker>
      <input
        type="number"
        inputMode="decimal"
        min={HEIGHT_RANGE.min}
        max={HEIGHT_RANGE.max}
        value={state.heightCm}
        onChange={(e) => onChange({ heightCm: e.target.value })}
        placeholder="Ej. 175"
        aria-label="Altura en centímetros"
        className={`mt-2 ${inputCls}`}
      />
      {showHeightError && (
        <p role="alert" className="mt-2 text-xs text-danger">
          Introduce una altura entre {HEIGHT_RANGE.min} y {HEIGHT_RANGE.max} cm.
        </p>
      )}
      <Kicker>Peso</Kicker>
      <input
        type="number"
        inputMode="decimal"
        min={WEIGHT_RANGE.min}
        max={WEIGHT_RANGE.max}
        value={state.weightKg}
        onChange={(e) => onChange({ weightKg: e.target.value })}
        placeholder="Ej. 75"
        aria-label="Peso en kilogramos"
        className={`mt-2 ${inputCls}`}
      />
      {showWeightError && (
        <p role="alert" className="mt-2 text-xs text-danger">
          Introduce un peso entre {WEIGHT_RANGE.min} y {WEIGHT_RANGE.max} kg.
        </p>
      )}
    </div>
  )
}

// Paso 5 — Resumen: intereses de guías, términos y rutina sugerida.
export const SummaryStep = ({ state, onChange, suggested }: StepProps & { suggested: Routine | undefined }) => {
  const toggleInterest = (v: GuideCategory) =>
    onChange({
      guideInterests: state.guideInterests.includes(v)
        ? state.guideInterests.filter((i) => i !== v)
        : [...state.guideInterests, v],
    })
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-fg">Tu plan está listo</h1>
      <p className="mt-1 text-sm text-muted">Te sugerimos esta rutina para empezar:</p>
      {suggested ? (
        <div className="mt-4 rounded-2xl border border-cta/40 bg-cta/10 p-4">
          <p className="font-display text-base font-semibold text-accent-soft">{suggested.title}</p>
          <p className="mt-1 text-xs capitalize text-muted">
            {suggested.level} · {suggested.daysCount} días · {suggested.objective}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-fg">{suggested.description}</p>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-gold/40 p-4 text-sm text-muted">
          Aún estamos preparando las rutinas. Puedes empezar igualmente.
        </p>
      )}
      <Kicker>¿Qué temas te interesan?</Kicker>
      <div className="mt-2 flex flex-wrap gap-2">
        {GUIDE_OPTIONS.map((g) => (
          <Chip key={g.value} selected={state.guideInterests.includes(g.value)} onSelect={() => toggleInterest(g.value)}>
            {g.label}
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
          He leído y acepto los <span className="text-accent-soft">términos de uso</span> y la{' '}
          <span className="text-accent-soft">política de privacidad</span> de GymLab.
        </span>
      </label>
    </div>
  )
}
