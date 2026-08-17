// Pestaña de estadísticas corporales: peso, IMC, medidas, ratios, grasa y composición en paneles premium.
import { useMemo } from 'react'
import { CompositionChart } from './CompositionChart'
import { CompositionDonut } from './CompositionDonut'
import { ImcChart } from './ImcChart'
import { RatiosChart } from './RatiosChart'
import { BodyWeightChart } from '@/components/profile/BodyWeightChart'
import { BodyMeasurementsChart } from '@/components/body/BodyMeasurementsChart'
import { SkinfoldChart } from '@/components/body/SkinfoldChart'
import { buildBodyCompSeries, buildImcSeries, buildRatiosSeries, bodyFatCategory, bodyFatCategoryColor, bodyFatCategoryLabel } from '@/domain/calculators/bodyComposition'
import { calcJacksonPollock } from '@/domain/calculators/bodyComposition'
import type { BodyMeasurementEntry, BodyWeightEntry, Sex, SkinfoldEntry } from '@/domain/types'

type Props = {
  weightEntries: BodyWeightEntry[]
  measurementEntries: BodyMeasurementEntry[]
  skinfoldEntries: SkinfoldEntry[]
  heightCm: number
  sex: Sex
}

export const CuerpoStats = ({ weightEntries, measurementEntries, skinfoldEntries, heightCm, sex }: Props) => {
  const imcPoints = useMemo(() => buildImcSeries(weightEntries, heightCm), [weightEntries, heightCm])
  const ratiosPoints = useMemo(() => buildRatiosSeries(measurementEntries, heightCm), [measurementEntries, heightCm])
  const compPoints = useMemo(() => buildBodyCompSeries(skinfoldEntries), [skinfoldEntries])
  const latestComp = compPoints[compPoints.length - 1]

  const latestCategory = useMemo(() => {
    const latest = skinfoldEntries[skinfoldEntries.length - 1]
    if (!latest) return null
    const r7 = calcJacksonPollock({ sites: latest.sites, sex: latest.sex, age: latest.age }, '7')
    const r3 = calcJacksonPollock({ sites: latest.sites, sex: latest.sex, age: latest.age }, '3')
    const pct = r7.bodyFatPct ?? r3.bodyFatPct
    return pct != null ? { pct, cat: bodyFatCategory(pct, latest.sex) } : null
  }, [skinfoldEntries])

  return (
    <div className="flex flex-col gap-3">
      <BodyWeightChart entries={weightEntries} />
      <ImcChart points={imcPoints} />
      <BodyMeasurementsChart entries={measurementEntries} />
      <RatiosChart points={ratiosPoints} sex={sex} />
      <SkinfoldChart entries={skinfoldEntries} />
      {latestCategory && (
        <p className="text-center text-sm">
          <span className="text-muted">Última categoría: </span>
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
