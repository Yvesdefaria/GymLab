// Resultado en vivo de grasa corporal (Jackson-Pollock 7/3 + Siri): % héroe, categoría i18n,
// densidad, protocolo y masas. Sin datos muestra un estado vacío honesto.
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/ui/EmptyState'
import { CalculatorResult } from '@/components/calculators/CalculatorResult'
import {
  bodyFatCategory,
  calcFatFreeMass,
  calcFatMass,
} from '@/domain/calculators/bodyComposition'
import type { Sex } from '@/domain/types'

export interface BodyFatActiveResult {
  bodyFatPct: number
  bodyDensity: number | null
  protocol: '7' | '3'
}

interface BodyFatResultCardProps {
  active: BodyFatActiveResult | null
  hasAge: boolean
  weightNum: number
  sex: Sex
}

export const BodyFatResultCard = ({ active, hasAge, weightNum, sex }: BodyFatResultCardProps) => {
  const { t } = useTranslation()
  if (!active) {
    return (
      <EmptyState
        size="sm"
        message={hasAge ? t('grasa.vacioPliegues') : t('grasa.vacioEdad')}
      />
    )
  }

  const category = bodyFatCategory(active.bodyFatPct, sex)
  const fatMass = weightNum > 0 ? calcFatMass(weightNum, active.bodyFatPct) : null
  const fatFreeMass = weightNum > 0 ? calcFatFreeMass(weightNum, active.bodyFatPct) : null
  const tone = category === 'atleta' ? 'success' : category === 'alto' ? 'danger' : 'gold'

  return (
    <CalculatorResult
      eyebrow={t('grasa.tuGrasa')}
      value={active.bodyFatPct}
      unit="%"
      label={t(`grasa.categorias.${category}`)}
      tone={tone}
      note={`${active.bodyDensity != null ? t('grasa.densidad', { valor: active.bodyDensity.toFixed(4) }) : ''}${t('grasa.protocolo', {
        tipo: active.protocol === '7' ? t('grasa.de7') : t('grasa.de3'),
      })}`}
      testId="grasa-result"
    >
      {fatMass != null && fatFreeMass != null && (
        <div className="mt-2 text-[11px]">
          <div className="flex items-baseline justify-between border-b border-border/40 py-2">
            <span className="text-muted">{t('grasa.masaGrasa')}</span>
            <span className="tabular-nums text-fg">{fatMass} kg</span>
          </div>
          <div className="flex items-baseline justify-between border-b border-border/40 py-2">
            <span className="text-muted">{t('grasa.masaMagra')}</span>
            <span className="tabular-nums text-fg">{fatFreeMass} kg</span>
          </div>
        </div>
      )}
    </CalculatorResult>
  )
}
