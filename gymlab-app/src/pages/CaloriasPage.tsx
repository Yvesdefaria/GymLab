// Página «Calorías y macros»: TDEE, rangos y macros con el patrón result hero.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalculatorShell } from '@/components/calculators/CalculatorShell'
import { CalculatorSection } from '@/components/calculators/CalculatorSection'
import { CalculatorField } from '@/components/calculators/CalculatorField'
import { CalculatorResult } from '@/components/calculators/CalculatorResult'
import { CalculatorDisclaimer } from '@/components/calculators/CalculatorDisclaimer'
import { useAgePrefill } from '@/hooks/useAgePrefill'
import { useBodyProfile } from '@/hooks/useBodyProfile'
import { calcTDEERange, type Sexo, type NivelActividad } from '@/domain/calculators/tdee'
import { calcMacros, type MacroObjetivo } from '@/domain/calculators/macros'
import { formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

const ACTIVITY_LEVELS: NivelActividad[] = ['sedentario', 'ligero', 'moderado', 'intenso', 'muy_intenso']
const GOALS: MacroObjetivo[] = ['volumen', 'mantenimiento', 'definicion']

export const CaloriasPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [sexo, setSexo] = useState<Sexo | null>(null)
  const [edad, setEdad] = useState<number | undefined>(undefined)
  const [peso, setPeso] = useState<number | undefined>(undefined)
  const [altura, setAltura] = useState<number | undefined>(undefined)
  const [actividad, setActividad] = useState<NivelActividad>('sedentario')
  const [objetivo, setObjetivo] = useState<MacroObjetivo>('mantenimiento')
  // Datos del onboarding: sexo, peso y altura se usan como default editable.
  const { heightCm, sex: profileSex, weightKg } = useBodyProfile()
  const effectiveSexo = sexo ?? profileSex

  // Edad pre-rellenada desde el perfil (siempre editable).
  useAgePrefill(
    edad === undefined ? '' : String(edad),
    (v) => setEdad(v === '' ? undefined : Number(v)),
  )

  // Peso y altura del onboarding solo rellenan campos vacíos: no pisan lo tecleado.
  useEffect(() => {
    if (peso === undefined && weightKg != null) setPeso(weightKg)
  }, [peso, weightKg])
  useEffect(() => {
    if (altura === undefined && heightCm != null) setAltura(heightCm)
  }, [altura, heightCm])

  // Entradas tolerantes a vacío; el resultado requiere los tres campos rellenados.
  const edadNum = edad ?? 0
  const pesoNum = peso ?? 0
  const alturaNum = altura ?? 0
  const showResult = edadNum > 0 && pesoNum > 0 && alturaNum > 0

  const result = showResult
    ? calcTDEERange(pesoNum, alturaNum, edadNum, effectiveSexo, actividad)
    : null
  const macros = showResult
    ? calcMacros(pesoNum, alturaNum, edadNum, effectiveSexo, actividad, objetivo)
    : null

  const macroCalories = macros
    ? { proteina: macros.proteina * 4, carbohidratos: macros.carbohidratos * 4, grasas: macros.grasas * 9 }
    : null
  const macroTotal = macroCalories
    ? Math.max(1, macroCalories.proteina + macroCalories.carbohidratos + macroCalories.grasas)
    : 1

  return (
    <CalculatorShell
      title={t('calculadoras.calorias.titulo')}
      subtitle={t('calculadoras.calorias.subtitulo')}
    >
      <CalculatorSection title={t('calculadoras.calorias.tusDatos')} meta={t('calculadoras.calorias.perfil')}>
        <div className="flex gap-2 pb-1">
          {(['hombre', 'mujer'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSexo(s)}
              aria-pressed={effectiveSexo === s}
              className={`flex min-h-[44px] flex-1 items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
                effectiveSexo === s
                  ? 'border-gold/60 bg-cta/10 text-gold-bright'
                  : 'border-border/50 text-muted'
              }`}
            >
              {t(s === 'hombre' ? 'calculadoras.calorias.sexoHombre' : 'calculadoras.calorias.sexoMujer')}
            </button>
          ))}
        </div>
        <CalculatorField id="tdee-edad" label={t('calculadoras.calorias.edad')} value={edad} onChange={setEdad} placeholder="25" mode="integer" suffix={t('calculadoras.calorias.anios')} />
        <CalculatorField id="tdee-peso" label={t('calculadoras.calorias.peso')} value={peso} onChange={setPeso} placeholder="70" suffix="kg" />
        <CalculatorField id="tdee-altura" label={t('calculadoras.calorias.altura')} value={altura} onChange={setAltura} placeholder="175" suffix="cm" />
        <label htmlFor="tdee-actividad" className="flex min-h-[52px] items-center justify-between gap-3 border-b border-border/40">
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
            {t('calculadoras.calorias.nivelActividad')}
          </span>
          <select
            id="tdee-actividad"
            value={actividad}
            onChange={(e) => setActividad(e.target.value as NivelActividad)}
            className="max-w-[58%] bg-transparent text-right text-[12px] text-fg focus:outline-none"
          >
            {ACTIVITY_LEVELS.map((key) => (
              <option key={key} value={key}>
                {t(`calculadoras.calorias.actividadesCortas.${key}`)}
              </option>
            ))}
          </select>
        </label>
      </CalculatorSection>

      <div className="flex gap-1.5 overflow-hidden pt-1">
        {GOALS.map((goal) => (
          <button
            key={goal}
            type="button"
            onClick={() => setObjetivo(goal)}
            aria-pressed={objetivo === goal}
            className={`min-h-[36px] flex-1 rounded-full border text-[10.5px] font-medium transition-colors ${
              objetivo === goal
                ? 'border-gold/60 bg-cta/10 text-gold-bright'
                : 'border-border/50 text-muted'
            }`}
          >
            {t(`calculadoras.macros.objetivosCortos.${goal}`)}
          </button>
        ))}
      </div>

      {result && macros && macroCalories && (
        <>
          <CalculatorResult
            eyebrow={t('calculadoras.calorias.tdee')}
            value={formatNumber(result.tdee, lang)}
            unit={t('calculadoras.calorias.kcalDia')}
            label={t('calculadoras.calorias.mantenimiento')}
            tone="gold"
            testId="calorias-result"
          />

          <CalculatorSection title={t('calculadoras.calorias.rangos')} meta={t('calculadoras.calorias.kcal')}>
            <div className="text-[12px]">
              <div className="flex items-baseline justify-between gap-3 border-b border-border/40 py-2.5">
                <span className="text-muted">{t('calculadoras.calorias.deficit')} · {t('calculadoras.calorias.deficitHint')}</span>
                <span className="tabular-nums text-fg">{formatNumber(result.deficit, lang)} kcal</span>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-border/40 py-2.5">
                <span className="text-muted">{t('calculadoras.calorias.superavit')} · {t('calculadoras.calorias.superavitHint')}</span>
                <span className="tabular-nums text-fg">{formatNumber(result.superavit, lang)} kcal</span>
              </div>
            </div>
          </CalculatorSection>

          <CalculatorSection
            title={t('calculadoras.macros.titulo')}
            meta={t('calculadoras.macros.kcalDiaObjetivo', { objetivo: t(`calculadoras.macros.objetivos.${objetivo}`) })}
          >
            <p className="pb-1 text-[10.5px] text-muted">
              {formatNumber(macros.calorias, lang)} kcal · {t(`calculadoras.macros.objetivosCortos.${objetivo}`)}
            </p>
            {(['proteina', 'carbohidratos', 'grasas'] as const).map((macro) => {
              const grams = macros[macro]
              const kcal = macroCalories[macro]
              const pct = Math.round((kcal / macroTotal) * 100)
              return (
                <div key={macro} className="border-b border-border/40 py-2.5 last:border-b-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[12px] font-medium text-fg">
                      {t(`calculadoras.macros.${macro}`)}
                    </span>
                    <span className="text-[10.5px] tabular-nums text-muted">
                      {formatNumber(grams, lang)} g · {pct} %
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border/50">
                    <i className="block h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CalculatorSection>
        </>
      )}

      <CalculatorDisclaimer>{t('calculadoras.calorias.disclaimer')}</CalculatorDisclaimer>
    </CalculatorShell>
  )
}
