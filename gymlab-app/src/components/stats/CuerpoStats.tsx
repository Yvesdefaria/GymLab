// Pestaña de estadísticas corporales: peso, IMC, medidas, ratios, grasa y composición en paneles premium.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CompositionChart } from './CompositionChart'
import { CompositionDonut } from './CompositionDonut'
import { ImcChart } from './ImcChart'
import { RatiosChart } from './RatiosChart'
import { BodyWeightChart } from '@/components/profile/BodyWeightChart'
import { BodyMeasurementsChart } from '@/components/body/BodyMeasurementsChart'
import { SkinfoldChart } from '@/components/body/SkinfoldChart'
import {
  buildBodyCompSeries,
  buildImcSeries,
  buildRatiosSeries,
  bodyFatCategoryColor,
  bodyFatCategoryLabel,
  latestBodyFat,
} from '@/domain/calculators/bodyComposition'
import type { BodyMeasurementEntry, BodyWeightEntry, Sex, SkinfoldEntry } from '@/domain/types'

type Props = {
  weightEntries: BodyWeightEntry[]
  measurementEntries: BodyMeasurementEntry[]
  skinfoldEntries: SkinfoldEntry[]
  heightCm: number
  sex: Sex
}

export const CuerpoStats = ({ weightEntries, measurementEntries, skinfoldEntries, heightCm, sex }: Props) => {
  const { t } = useTranslation()
  const imcPoints = useMemo(() => buildImcSeries(weightEntries, heightCm), [weightEntries, heightCm])
  const ratiosPoints = useMemo(() => buildRatiosSeries(measurementEntries, heightCm), [measurementEntries, heightCm])
  const compPoints = useMemo(() => buildBodyCompSeries(skinfoldEntries, heightCm), [skinfoldEntries, heightCm])
  const latestComp = compPoints[compPoints.length - 1]
  const latestCategory = useMemo(() => latestBodyFat(skinfoldEntries), [skinfoldEntries])

  return (
    <div className="flex flex-col gap-3">
      <BodyWeightChart entries={weightEntries} />
      <ImcChart points={imcPoints} />
      <BodyMeasurementsChart entries={measurementEntries} />
      <RatiosChart points={ratiosPoints} sex={sex} />
      <SkinfoldChart entries={skinfoldEntries} />
      {latestCategory && (
        <p className="text-center text-sm">
          <span className="text-muted">{t('stats.ultimaCategoria')}</span>
          <span className="font-medium" style={{ color: bodyFatCategoryColor(latestCategory.cat) }}>
            {bodyFatCategoryLabel(latestCategory.cat)} ({latestCategory.pct}%)
          </span>
        </p>
      )}
      <CompositionChart points={compPoints} />
      {latestComp && <CompositionDonut point={latestComp} />}
    </div>
  )
}
