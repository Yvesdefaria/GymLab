// Delta de peso entre las dos fechas del comparador. Solo se renderiza cuando
// ambas fechas tienen registro; no inventa un cero.
import { useTranslation } from 'react-i18next'
import { applyUnits, formatUnits, type Units } from '@/domain/settings'
import type { WeightDelta } from '@/domain/bodyProgress'

type Props = {
  delta: WeightDelta
  units: Units
}

export const CompareWeightDelta = ({ delta, units }: Props) => {
  const { t } = useTranslation()
  const unit = formatUnits(units)
  const fmt = (kg: number) => `${applyUnits(kg, units).toFixed(1)} ${unit}`
  const signed = `${delta.deltaKg > 0 ? '+' : ''}${applyUnits(delta.deltaKg, units).toFixed(1)}`

  return (
    <p className="mt-2 flex items-center justify-center gap-2 text-[10px] text-muted">
      <span>{t('progressPhotos.weight')}</span>
      <span className="tabular-nums">
        {fmt(delta.fromKg)} → {fmt(delta.toKg)}
      </span>
      <span className="font-semibold tabular-nums text-gold-bright">
        {signed} {unit}
      </span>
    </p>
  )
}
