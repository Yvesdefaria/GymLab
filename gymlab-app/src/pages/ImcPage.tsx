// Página /calculadoras/imc: IMC (OMS) con result hero, escala de categorías y desglose.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalculatorShell } from '@/components/calculators/CalculatorShell'
import { CalculatorSection } from '@/components/calculators/CalculatorSection'
import { CalculatorField } from '@/components/calculators/CalculatorField'
import { CalculatorResult } from '@/components/calculators/CalculatorResult'
import { CalculatorDisclaimer } from '@/components/calculators/CalculatorDisclaimer'
import { useBodyProfile } from '@/hooks/useBodyProfile'
import { calcIMC, getIMCCategory, IMC_THRESHOLDS } from '@/domain/calculators/imc'
import { formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

export const ImcPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [peso, setPeso] = useState<number | undefined>(undefined)
  const [altura, setAltura] = useState<number | undefined>(undefined)
  // Peso y altura del onboarding: defaults editables que no pisan lo tecleado.
  const { heightCm, weightKg } = useBodyProfile()

  useEffect(() => {
    if (peso === undefined && weightKg != null) setPeso(weightKg)
  }, [peso, weightKg])
  useEffect(() => {
    if (altura === undefined && heightCm != null) setAltura(heightCm)
  }, [altura, heightCm])

  // Cálculo en vivo: solo se muestra resultado cuando ambos valores son positivos.
  const pesoNum = peso ?? 0
  const alturaNum = altura ?? 0
  const imc = calcIMC(pesoNum, alturaNum)
  const category = getIMCCategory(imc)
  const showResult = pesoNum > 0 && alturaNum > 0

  // Rango de peso saludable para la altura actual (18,5–24,9 de IMC).
  const heightM = alturaNum / 100
  const healthyMin = 18.5 * heightM * heightM
  const healthyMax = 24.9 * heightM * heightM

  const categoryIndex = ['bajo_peso', 'normal', 'sobrepeso', 'obesidad'].indexOf(category)
  const tone = category === 'normal' ? 'success' : category === 'obesidad' ? 'danger' : 'gold'

  return (
    <CalculatorShell
      title={t('calculadoras.imc.titulo')}
      subtitle={t('calculadoras.imc.subtitulo')}
    >
      <CalculatorSection title={t('calculadoras.imc.tusDatos')} meta={t('calculadoras.imc.oms')}>
        <CalculatorField
          label={t('calculadoras.imc.alturaLabel')}
          value={altura}
          onChange={setAltura}
          placeholder="175"
          suffix="cm"
        />
        <CalculatorField
          label={t('calculadoras.imc.pesoLabel')}
          value={peso}
          onChange={setPeso}
          placeholder="70"
          suffix="kg"
        />
      </CalculatorSection>

      {showResult && (
        <CalculatorResult
          eyebrow={t('calculadoras.imc.tuImc')}
          value={formatNumber(imc, lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          label={t(`calculadoras.imc.categorias.${category}`)}
          tone={tone}
          testId="imc-result"
        >
          <div className="mt-3 flex gap-1" aria-hidden>
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className={`h-1.5 flex-1 rounded-full ${index === categoryIndex ? 'bg-gold' : 'bg-border/60'}`}
              />
            ))}
          </div>
          <div className="flex justify-between pt-1 text-[8.5px] tabular-nums text-muted">
            <span>{IMC_THRESHOLDS[0]}</span>
            <span>{IMC_THRESHOLDS[1]}</span>
            <span>{IMC_THRESHOLDS[2]}</span>
            <span>40</span>
          </div>
        </CalculatorResult>
      )}

      {showResult && (
        <CalculatorSection title={t('calculadoras.imc.desglose')} meta={t('calculadoras.imc.oms')}>
          <div className="text-[12px]">
            <div className="flex items-baseline justify-between gap-3 border-b border-border/40 py-2.5">
              <span className="text-muted">{t('calculadoras.imc.rangoSaludable')}</span>
              <span className="tabular-nums text-fg">
                {formatNumber(healthyMin, lang, { maximumFractionDigits: 1 })} –{' '}
                {formatNumber(healthyMax, lang, { maximumFractionDigits: 1 })} kg
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-b border-border/40 py-2.5">
              <span className="text-muted">{t('calculadoras.imc.margenTecho')}</span>
              <span className="tabular-nums text-fg">
                {healthyMax - pesoNum >= 0 ? '+' : ''}
                {formatNumber(healthyMax - pesoNum, lang, { maximumFractionDigits: 1 })} kg
              </span>
            </div>
          </div>
        </CalculatorSection>
      )}

      <CalculatorDisclaimer>{t('calculadoras.imc.disclaimer')}</CalculatorDisclaimer>
    </CalculatorShell>
  )
}
