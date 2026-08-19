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
      <p className="rounded-xl bg-accent/10 px-3 py-2 text-[0.6rem] text-accent">{t('navy.disclaimer')}</p>

      {/* Sexo */}
      <div className="flex gap-2">
        <button onClick={() => setSex('hombre')} className={`flex-1 rounded-lg py-2 text-[0.6rem] font-medium ${sex === 'hombre' ? 'bg-accent text-accent-fg' : 'bg-bg-elevated/50 text-muted'}`}>{t('navy.male')}</button>
        <button onClick={() => setSex('mujer')} className={`flex-1 rounded-lg py-2 text-[0.6rem] font-medium ${sex === 'mujer' ? 'bg-accent text-accent-fg' : 'bg-bg-elevated/50 text-muted'}`}>{t('navy.female')}</button>
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-2">
        <input type="number" placeholder={t('navy.height')} value={height} onChange={(e) => setHeight(e.target.value)} className="rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.65rem] text-fg" />
        <input type="number" placeholder={t('navy.neck')} value={neck} onChange={(e) => setNeck(e.target.value)} className="rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.65rem] text-fg" />
        <input type="number" placeholder={t('navy.waist')} value={waist} onChange={(e) => setWaist(e.target.value)} className="rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.65rem] text-fg" />
        {sex === 'mujer' && (
          <input type="number" placeholder={t('navy.hip')} value={hip} onChange={(e) => setHip(e.target.value)} className="rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.65rem] text-fg" />
        )}
        <input type="number" placeholder={t('navy.weight')} value={weight} onChange={(e) => setWeight(e.target.value)} className="rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.65rem] text-fg" />
        <button onClick={handleCalc} className="rounded-lg bg-accent py-2 text-[0.65rem] font-medium text-accent-fg">{t('navy.calc')}</button>
      </div>

      {/* Resultado */}
      {result && (
        <div className="rounded-xl border border-accent/50 bg-accent/10 p-3">
          <p className="text-[0.8rem] font-bold text-accent">{result.bodyFatPct}% {t('navy.bodyFat')}</p>
          <p className="text-[0.65rem] text-fg">{result.classification}</p>
          {result.leanMassKg !== null && (
            <p className="text-[0.6rem] text-muted">{t('navy.lean')}: {result.leanMassKg}kg · {t('navy.fat')}: {result.fatMassKg}kg</p>
          )}
        </div>
      )}
    </div>
  )
}
