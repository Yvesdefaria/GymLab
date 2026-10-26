// Calculadora Navy: estima % grasa corporal con el método de la Marina (sin picómetro).
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalculatorSection } from '@/components/calculators/CalculatorSection'
import { CalculatorField } from '@/components/calculators/CalculatorField'
import { CalculatorResult } from '@/components/calculators/CalculatorResult'
import { useBodyProfile } from '@/hooks/useBodyProfile'
import { calcNavy, type NavyClass, type Sex, type NavyResult } from '@/domain/calculators/navy'
import { formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

export const NavyCalculator = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  // Sexo, altura y peso se heredan del onboarding mientras el usuario no los cambie.
  const { heightCm, sex: profileSex, weightKg } = useBodyProfile()
  const [sex, setSex] = useState<Sex | null>(null)
  const effectiveSex = sex ?? profileSex
  const [height, setHeight] = useState<number | undefined>(undefined)
  const [neck, setNeck] = useState<number | undefined>(undefined)
  const [waist, setWaist] = useState<number | undefined>(undefined)
  const [hip, setHip] = useState<number | undefined>(undefined)
  const [weight, setWeight] = useState<number | undefined>(undefined)
  const [result, setResult] = useState<NavyResult | null>(null)

  // Prefill solo en campos vacíos; el usuario puede sobrescribirlos sin que vuelvan.
  useEffect(() => {
    if (height === undefined && heightCm != null) setHeight(heightCm)
  }, [height, heightCm])
  useEffect(() => {
    if (weight === undefined && weightKg != null) setWeight(weightKg)
  }, [weight, weightKg])

  const handleCalc = () => {
    // Requeridos: altura, cuello y cintura; caderas solo si es mujer.
    if (height === undefined || neck === undefined || waist === undefined) return
    if (effectiveSex === 'mujer' && hip === undefined) return
    setResult(calcNavy({ sex: effectiveSex, heightCm: height, neckCm: neck, waistCm: waist, hipCm: hip ?? Number.NaN }, weight))
  }

  // El copy de la clasificación conserva la concordancia de género del baseline.
  type NavyClassKey =
    | 'navy.classifications.essential'
    | 'navy.classifications.athletic'
    | 'navy.classifications.fitness'
    | 'navy.classifications.average'
    | 'navy.classifications.obese'
    | 'navy.classificationsFemale.essential'
    | 'navy.classificationsFemale.athletic'
    | 'navy.classificationsFemale.fitness'
    | 'navy.classificationsFemale.average'
    | 'navy.classificationsFemale.obese'
  const classificationKey: Record<NavyClass, NavyClassKey> =
    effectiveSex === 'mujer'
      ? {
          essential: 'navy.classificationsFemale.essential',
          athletic: 'navy.classificationsFemale.athletic',
          fitness: 'navy.classificationsFemale.fitness',
          average: 'navy.classificationsFemale.average',
          obese: 'navy.classificationsFemale.obese',
        }
      : {
          essential: 'navy.classifications.essential',
          athletic: 'navy.classifications.athletic',
          fitness: 'navy.classifications.fitness',
          average: 'navy.classifications.average',
          obese: 'navy.classifications.obese',
        }

  return (
    <div className="space-y-4">
      <CalculatorSection title={t('navy.tusDatos')}>
        <div className="flex gap-2 pb-1">
          {(['hombre', 'mujer'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSex(s)}
              aria-pressed={effectiveSex === s}
              className={`flex min-h-[44px] flex-1 items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
                effectiveSex === s
                  ? 'border-gold/60 bg-cta/10 text-gold-bright'
                  : 'border-border/50 text-muted'
              }`}
            >
              {t(s === 'hombre' ? 'navy.male' : 'navy.female')}
            </button>
          ))}
        </div>
        <CalculatorField label={t('navy.height')} value={height} onChange={setHeight} placeholder="175" suffix="cm" />
        <CalculatorField label={t('navy.neck')} value={neck} onChange={setNeck} placeholder="38" suffix="cm" />
        <CalculatorField label={t('navy.waist')} value={waist} onChange={setWaist} placeholder="80" suffix="cm" />
        {effectiveSex === 'mujer' && (
          <CalculatorField label={t('navy.hip')} value={hip} onChange={setHip} placeholder="95" suffix="cm" />
        )}
        <CalculatorField label={t('navy.weight')} value={weight} onChange={setWeight} placeholder="75" suffix="kg" />
        <button
          type="button"
          onClick={handleCalc}
          className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-cta text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
        >
          {t('navy.calc')}
        </button>
      </CalculatorSection>

      {result && (
        <CalculatorResult
          eyebrow={t('navy.bodyFat')}
          value={formatNumber(result.bodyFatPct, lang, { maximumFractionDigits: 1 })}
          unit="%"
          label={t(classificationKey[result.classification])}
          tone="gold"
          testId="navy-result"
        >
          {result.leanMassKg !== null && result.fatMassKg !== null && (
            <div className="mt-2 text-[11px]">
              <div className="flex items-baseline justify-between border-b border-border/40 py-2">
                <span className="text-muted">{t('navy.lean')}</span>
                <span className="tabular-nums text-fg">
                  {formatNumber(result.leanMassKg, lang, { maximumFractionDigits: 1 })} kg
                </span>
              </div>
              <div className="flex items-baseline justify-between border-b border-border/40 py-2">
                <span className="text-muted">{t('navy.fat')}</span>
                <span className="tabular-nums text-fg">
                  {formatNumber(result.fatMassKg, lang, { maximumFractionDigits: 1 })} kg
                </span>
              </div>
            </div>
          )}
        </CalculatorResult>
      )}
    </div>
  )
}
