// Calculadora Navy: estima % grasa corporal con método de la Marina.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DecimalInput } from '@/components/ui/DecimalInput'
import { calcNavy, type Sex, type NavyResult } from '@/domain/calculators/navy'

export const NavyCalculator = () => {
  const { t } = useTranslation()
  const [sex, setSex] = useState<Sex>('hombre')
  const [height, setHeight] = useState<number | undefined>(undefined)
  const [neck, setNeck] = useState<number | undefined>(undefined)
  const [waist, setWaist] = useState<number | undefined>(undefined)
  const [hip, setHip] = useState<number | undefined>(undefined)
  const [weight, setWeight] = useState<number | undefined>(undefined)
  const [result, setResult] = useState<NavyResult | null>(null)

  const handleCalc = () => {
    // Requeridos: altura, cuello y cintura; caderas solo si es mujer.
    if (height === undefined || neck === undefined || waist === undefined) return
    if (sex === 'mujer' && hip === undefined) return
    setResult(calcNavy({ sex, heightCm: height, neckCm: neck, waistCm: waist, hipCm: hip ?? Number.NaN }, weight))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Disclaimer */}
      <p className="rounded-xl bg-accent/10 px-4 py-2.5 text-xs text-accent">{t('navy.disclaimer')}</p>

      {/* Sexo */}
      <div className="flex gap-2">
        <button onClick={() => setSex('hombre')} className={`flex-1 min-h-[44px] rounded-xl py-2.5 text-sm font-medium transition-colors ${sex === 'hombre' ? 'bg-accent text-accent-fg' : 'bg-bg-elevated/50 text-muted'}`}>{t('navy.male')}</button>
        <button onClick={() => setSex('mujer')} className={`flex-1 min-h-[44px] rounded-xl py-2.5 text-sm font-medium transition-colors ${sex === 'mujer' ? 'bg-accent text-accent-fg' : 'bg-bg-elevated/50 text-muted'}`}>{t('navy.female')}</button>
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-3">
        <DecimalInput placeholder={t('navy.height')} value={height} onChange={setHeight} className="min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-4 py-3 text-sm text-fg" />
        <DecimalInput placeholder={t('navy.neck')} value={neck} onChange={setNeck} className="min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-4 py-3 text-sm text-fg" />
        <DecimalInput placeholder={t('navy.waist')} value={waist} onChange={setWaist} className="min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-4 py-3 text-sm text-fg" />
        {sex === 'mujer' && (
          <DecimalInput placeholder={t('navy.hip')} value={hip} onChange={setHip} className="min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-4 py-3 text-sm text-fg" />
        )}
        <DecimalInput placeholder={t('navy.weight')} value={weight} onChange={setWeight} className="min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-4 py-3 text-sm text-fg" />
        <button onClick={handleCalc} className="min-h-[48px] rounded-xl bg-accent py-3 text-sm font-medium text-accent-fg">{t('navy.calc')}</button>
      </div>

      {/* Resultado */}
      {result && (
        <div className="rounded-2xl border border-accent/50 bg-accent/10 p-4">
          <p className="text-lg font-bold text-accent">{result.bodyFatPct}% {t('navy.bodyFat')}</p>
          <p className="text-sm text-fg">{result.classification}</p>
          {result.leanMassKg !== null && (
            <p className="mt-1 text-xs text-muted">{t('navy.lean')}: {result.leanMassKg}kg · {t('navy.fat')}: {result.fatMassKg}kg</p>
          )}
        </div>
      )}
    </div>
  )
}
