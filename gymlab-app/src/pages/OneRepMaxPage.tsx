// Página /calculadoras/1rm: estimación de 1RM (Brzycki/Epley) y comparación con el PR.
import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CalculatorShell } from '@/components/calculators/CalculatorShell'
import { CalculatorSection } from '@/components/calculators/CalculatorSection'
import { CalculatorField } from '@/components/calculators/CalculatorField'
import { CalculatorResult } from '@/components/calculators/CalculatorResult'
import { CalculatorDisclaimer } from '@/components/calculators/CalculatorDisclaimer'
import { OneRmExerciseSelector } from '@/components/calculators/OneRmExerciseSelector'
import { OneRmRecordCard } from '@/components/calculators/OneRmRecordCard'
import { oneRepMaxLabel } from '@/domain/calculators/oneRepMax'
import { usePRs } from '@/hooks/usePRs'
import { formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { Exercise } from '@/domain/types'

export const OneRepMaxPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [peso, setPeso] = useState<number | undefined>(undefined)
  const [reps, setReps] = useState<number | undefined>(undefined)
  const [ejercicio, setEjercicio] = useState<Exercise | null>(null)
  const { prMap } = usePRs()

  // Estimación en vivo; solo se muestra resultado con peso y reps positivos.
  const pesoNum = peso ?? 0
  const repsNum = reps ?? 0
  const result = oneRepMaxLabel(pesoNum, repsNum)
  const showResult = pesoNum > 0 && repsNum > 0
  const pr = ejercicio ? prMap.get(ejercicio.id) : undefined

  return (
    <CalculatorShell
      title={t('calculadoras.oneRm.titulo')}
      subtitle={t('calculadoras.oneRm.subtitulo')}
    >
      <CalculatorSection title={t('calculadoras.oneRm.tusDatos')} meta={t('calculadoras.oneRm.opcional')}>
        <p className="pb-2 text-[10px] leading-relaxed text-muted">{t('calculadoras.oneRm.intro')}</p>
        <OneRmExerciseSelector value={ejercicio} onChange={setEjercicio} />
        <CalculatorField
          label={t('calculadoras.oneRm.pesoLevantado')}
          value={peso}
          onChange={setPeso}
          placeholder="80"
          suffix="kg"
        />
        <CalculatorField
          label={t('calculadoras.oneRm.repeticiones')}
          value={reps}
          onChange={setReps}
          placeholder="5"
          suffix="reps"
          mode="integer"
        />
      </CalculatorSection>

      {showResult && (
        <CalculatorResult
          eyebrow={t('calculadoras.oneRm.tuUnoRm')}
          value={formatNumber(result.brzycki, lang, { maximumFractionDigits: 1 })}
          unit="kg"
          label={t('calculadoras.oneRm.formulaBrzycki', { valor: formatNumber(result.brzycki, lang, { maximumFractionDigits: 1 }) })}
          tone="gold"
          testId="one-rm-result"
        >
          <div className="mt-2 text-[11px]">
            <div className="flex items-baseline justify-between border-b border-border/40 py-2">
              <span className="text-muted">{t('calculadoras.oneRm.epley')}</span>
              <span className="tabular-nums text-fg">{formatNumber(result.epley, lang, { maximumFractionDigits: 1 })} kg</span>
            </div>
            <div className="flex items-baseline justify-between border-b border-border/40 py-2">
              <span className="text-muted">{t('calculadoras.oneRm.diferenciaLabel')}</span>
              <span className="tabular-nums text-fg">{formatNumber(Math.abs(result.diferenciaKg), lang, { maximumFractionDigits: 1 })} kg</span>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[10.5px] text-muted">
            <Trophy className="size-3.5 text-gold" aria-hidden />
            {t('calculadoras.oneRm.consejo')}
          </p>
        </CalculatorResult>
      )}

      {pr && <OneRmRecordCard pr={pr} estimateKg={showResult ? result.brzycki : null} lang={lang} />}

      <CalculatorDisclaimer>{t('calculadoras.oneRm.disclaimer')}</CalculatorDisclaimer>
    </CalculatorShell>
  )
}
