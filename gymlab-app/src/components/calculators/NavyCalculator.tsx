// Calculadora Navy: estima % grasa corporal con método de la Marina.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calculator } from 'lucide-react'
import { calcNavy, type Sex, type NavyResult } from '@/domain/calculators/navy'

export const NavyCalculator = () => {
  const { t } = useTranslation()
  const [sex, setSex] = useState<Sex>('hombre')
  const [height, setHeight] = useState('')
  const [neck, setNeck] = useState('')
  const [waist, setWaist] = useState('')
  const [hip, setHip] = useState('')
  const [weight, setWeight] = useState('')
  const [result, setResult] = useState<NavyResult | null>(null)

  const handleCalc = () => {
    const h = parseFloat(height)
    const n = parseFloat(neck)
    const w = parseFloat(waist)
    const hp = parseFloat(hip)
    const wk = parseFloat(weight)
    if (isNaN(h) || isNaN(n) || isNaN(w)) return
    if (sex === 'mujer' && isNaN(hp)) return
    setResult(calcNavy({ sex, heightCm: h, neckCm: n, waistCm: w, hipCm: hp }, isNaN(wk) ? undefined : wk))
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
      <div className="flex items-center gap-2">
        <Calculator className="size-5 text-accent" aria-hidden />
        <h1 className="text-lg font-bold text-fg">{t('navy.title')}</h1>
      </div>

      {/* Disclaimer */}
      <p className="rounded-xl bg-accent/10 px-4 py-2.5 text-xs text-accent">{t('navy.disclaimer')}</p>

      {/* Sexo */}
      <div className="flex gap-2">
        <button onClick={() => setSex('hombre')} className={`flex-1 min-h-[44px] rounded-xl py-2.5 text-sm font-medium transition-colors ${sex === 'hombre' ? 'bg-accent text-accent-fg' : 'bg-bg-elevated/50 text-muted'}`}>{t('navy.male')}</button>
        <button onClick={() => setSex('mujer')} className={`flex-1 min-h-[44px] rounded-xl py-2.5 text-sm font-medium transition-colors ${sex === 'mujer' ? 'bg-accent text-accent-fg' : 'bg-bg-elevated/50 text-muted'}`}>{t('navy.female')}</button>
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-3">
        <input type="number" placeholder={t('navy.height')} value={height} onChange={(e) => setHeight(e.target.value)} className="min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-4 py-3 text-sm text-fg" />
        <input type="number" placeholder={t('navy.neck')} value={neck} onChange={(e) => setNeck(e.target.value)} className="min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-4 py-3 text-sm text-fg" />
        <input type="number" placeholder={t('navy.waist')} value={waist} onChange={(e) => setWaist(e.target.value)} className="min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-4 py-3 text-sm text-fg" />
        {sex === 'mujer' && (
          <input type="number" placeholder={t('navy.hip')} value={hip} onChange={(e) => setHip(e.target.value)} className="min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-4 py-3 text-sm text-fg" />
        )}
        <input type="number" placeholder={t('navy.weight')} value={weight} onChange={(e) => setWeight(e.target.value)} className="min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-4 py-3 text-sm text-fg" />
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
