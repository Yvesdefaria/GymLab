// Página «Agua diaria» (/calculadoras/agua): hidratación recomendada según peso y ejercicio.
import { useState } from 'react'
import { Droplets } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CalculatorShell } from '@/components/calculators/CalculatorShell'
import { CalculatorSection } from '@/components/calculators/CalculatorSection'
import { CalculatorField } from '@/components/calculators/CalculatorField'
import { CalculatorResult } from '@/components/calculators/CalculatorResult'
import { CalculatorDisclaimer } from '@/components/calculators/CalculatorDisclaimer'
import { calcDailyWater, calcVasosAgua } from '@/domain/calculators/water'
import { formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

export const AguaPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [peso, setPeso] = useState<number | undefined>(undefined)
  const [ejercicio, setEjercicio] = useState<number | undefined>(undefined)

  // Entradas tolerantes a vacío (undefined → 0); solo se muestra resultado si el peso es > 0.
  const pesoNum = peso ?? 0
  const minutos = ejercicio ?? 0
  const litros = calcDailyWater(pesoNum, minutos)
  const vasos = calcVasosAgua(litros)
  const showResult = pesoNum > 0

  return (
    <CalculatorShell
      title={t('calculadoras.agua.titulo')}
      subtitle={t('calculadoras.agua.subtitulo')}
    >
      <CalculatorSection title={t('calculadoras.agua.tusDatos')} meta={t('calculadoras.agua.base')}>
        <p className="pb-2 text-[10px] leading-relaxed text-muted">{t('calculadoras.agua.intro')}</p>
        <CalculatorField
          label={t('calculadoras.agua.pesoCorporal')}
          value={peso}
          onChange={setPeso}
          placeholder="70"
          suffix="kg"
        />
        <CalculatorField
          label={t('calculadoras.agua.ejercicioDiario')}
          value={ejercicio}
          onChange={setEjercicio}
          placeholder="30"
          suffix="min"
          mode="integer"
        />
      </CalculatorSection>

      {showResult && (
        <CalculatorResult
          eyebrow={t('calculadoras.agua.tuObjetivo')}
          value={formatNumber(litros, lang, { maximumFractionDigits: 1 })}
          unit="L"
          label={t('calculadoras.agua.vasos', { vasos })}
          tone="gold"
          testId="agua-result"
        >
          <div className="mt-3 flex gap-1.5" aria-hidden>
            {Array.from({ length: Math.min(vasos, 10) }).map((_, index) => (
              <span key={index} className="flex size-5 items-center justify-center rounded-full border border-gold/35 text-gold">
                <Droplets className="size-2.5" />
              </span>
            ))}
          </div>
        </CalculatorResult>
      )}

      <CalculatorDisclaimer>{t('calculadoras.agua.disclaimer')}</CalculatorDisclaimer>
    </CalculatorShell>
  )
}
