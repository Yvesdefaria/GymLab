// Tarjeta del resultado en vivo de grasa corporal (Jackson-Pollock 7/3 + Siri): muestra el % y
// la categoría coloreada, densidad, protocolo y masas. Autocontenida; si no hay datos aún,
// muestra el estado vacío según si falta edad o pliegues.
import { useTranslation } from 'react-i18next'
import { Percent } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  bodyFatCategory,
  bodyFatCategoryColor,
  bodyFatCategoryLabel,
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

  return (
    <section className="panel rounded-2xl p-6 text-center">
      <p className="kicker">{t('grasa.tuGrasa')}</p>
      <div className="flex items-center justify-center gap-2">
        <Percent className="size-6 text-accent" aria-hidden />
        <p className="stat-value text-4xl">{active.bodyFatPct}</p>
      </div>
      <p
        className="mt-1 font-display text-base font-semibold"
        style={{ color: bodyFatCategoryColor(category) }}
      >
        {bodyFatCategoryLabel(category)}
      </p>
      <p className="mt-1 text-xs text-muted">
        {active.bodyDensity != null &&
          t('grasa.densidad', { valor: active.bodyDensity.toFixed(4) })}
        {t('grasa.protocolo', {
          tipo: active.protocol === '7' ? t('grasa.de7') : t('grasa.de3'),
        })}
      </p>
      {fatMass != null && fatFreeMass != null && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/30 bg-bg-elevated/30 p-3">
            <p className="text-xs text-muted">{t('grasa.masaGrasa')}</p>
            <p className="font-display text-lg font-semibold text-fg">{fatMass} kg</p>
          </div>
          <div className="rounded-xl border border-border/30 bg-bg-elevated/30 p-3">
            <p className="text-xs text-muted">{t('grasa.masaMagra')}</p>
            <p className="font-display text-lg font-semibold text-fg">{fatFreeMass} kg</p>
          </div>
        </div>
      )}
    </section>
  )
}