// Página «Conversor lb ↔ kg» (/calculadoras/conversor): modo, cantidad y resultado héroe.
import { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CalculatorShell } from '@/components/calculators/CalculatorShell'
import { CalculatorSection } from '@/components/calculators/CalculatorSection'
import { CalculatorField } from '@/components/calculators/CalculatorField'
import { CalculatorResult } from '@/components/calculators/CalculatorResult'
import { CalculatorDisclaimer } from '@/components/calculators/CalculatorDisclaimer'
import { kgToLb, lbToKg } from '@/domain/calculators/converter'
import { formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

type Mode = 'kg-lb' | 'lb-kg'

export const ConversorPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [mode, setMode] = useState<Mode>('kg-lb')
  const [value, setValue] = useState<number | undefined>(undefined)

  // Deriva unidades y resultado según el modo; sin input (num = 0) no se muestra resultado.
  const num = value ?? 0
  const from = mode === 'kg-lb' ? 'kg' : 'lb'
  const to = mode === 'kg-lb' ? 'lb' : 'kg'
  const result = num > 0 ? (mode === 'kg-lb' ? kgToLb(num) : lbToKg(num)) : 0

  return (
    <CalculatorShell
      title={t('calculadoras.conversor.titulo')}
      subtitle={t('calculadoras.conversor.subtitulo')}
    >
      <CalculatorSection title={t('calculadoras.conversor.tusDatos')} meta="1 lb = 0,4536 kg">
        <div className="flex gap-2 pb-2">
          {(['kg-lb', 'lb-kg'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              aria-pressed={mode === option}
              className={`flex min-h-[44px] flex-1 items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
                mode === option
                  ? 'border-gold/60 bg-cta/10 text-gold-bright'
                  : 'border-border/50 text-muted'
              }`}
            >
              {t(option === 'kg-lb' ? 'calculadoras.conversor.modoKgLb' : 'calculadoras.conversor.modoLbKg')}
            </button>
          ))}
        </div>
        <CalculatorField
          label={t('calculadoras.conversor.cantidad', { unidad: from })}
          value={value}
          onChange={setValue}
          placeholder="100"
          suffix={from}
        />
      </CalculatorSection>

      {num > 0 && (
        <CalculatorResult
          eyebrow={t('calculadoras.conversor.resultado')}
          value={formatNumber(result, lang, { maximumFractionDigits: 1 })}
          unit={to}
          label={t('calculadoras.conversor.igualdad', {
            num: formatNumber(num, lang, { maximumFractionDigits: 1 }),
            desde: from,
            result: formatNumber(result, lang, { maximumFractionDigits: 1 }),
            hasta: to,
          })}
          tone="gold"
          testId="conversor-result"
        >
          <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted">
            <ArrowRightLeft className="size-3" aria-hidden />
            {t('calculadoras.conversor.nota')}
          </p>
        </CalculatorResult>
      )}

      <CalculatorDisclaimer>{t('calculadoras.conversor.nota')}</CalculatorDisclaimer>
    </CalculatorShell>
  )
}
