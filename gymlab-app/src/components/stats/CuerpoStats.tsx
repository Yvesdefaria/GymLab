// Pestaña de estadísticas corporales: peso, IMC, medidas, ratios, grasa y composición en paneles ordenados.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  // Series calculadas a partir de los registros crudos; se memoizan para no recalcular en cada render.
  const imcPoints = useMemo(() => buildImcSeries(weightEntries, heightCm), [weightEntries, heightCm])
  const ratiosPoints = useMemo(() => buildRatiosSeries(measurementEntries, heightCm), [measurementEntries, heightCm])
  const compPoints = useMemo(() => buildBodyCompSeries(skinfoldEntries), [skinfoldEntries])
  const latestComp = compPoints[compPoints.length - 1]

  // Categoría de grasa del último registro: calcula el % con Jackson-Pollock (7 o 3 pliegues) y lo clasifica.
  const latestCategory = useMemo(() => {
    const latest = skinfoldEntries[skinfoldEntries.length - 1]
    if (!latest) return null
    const r7 = calcJacksonPollock({ sites: latest.sites, sex: latest.sex, age: latest.age }, '7')
    const r3 = calcJacksonPollock({ sites: latest.sites, sex: latest.sex, age: latest.age }, '3')
    const pct = r7.bodyFatPct ?? r3.bodyFatPct
    return pct != null ? { pct, cat: bodyFatCategory(pct, latest.sex) } : null
  }, [skinfoldEntries])

  return (
    <>
      <div className="panel rounded-2xl p-4">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('stats.pesoCorporal')}
        </h2>
        <BodyWeightChart entries={weightEntries} />
      </div>

      <div className="panel rounded-2xl p-4">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('stats.imcTitulo')}
        </h2>
        <ImcChart points={imcPoints} />
      </div>

      <div className="panel rounded-2xl p-4">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('stats.medidasZona')}
        </h2>
        <BodyMeasurementsChart entries={measurementEntries} />
      </div>

      <div className="panel rounded-2xl p-4">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('stats.ratiosTitulo')}
        </h2>
        <RatiosChart points={ratiosPoints} sex={sex} />
      </div>

      <div className="panel rounded-2xl p-4">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('stats.grasaCorporal')}
        </h2>
        <SkinfoldChart entries={skinfoldEntries} />
        {latestCategory && (
          <p className="mt-1 text-center text-sm">
            <span className="text-muted">{t('stats.ultimaCategoria')} </span>
            <span className="font-medium" style={{ color: bodyFatCategoryColor(latestCategory.cat) }}>
              {bodyFatCategoryLabel(latestCategory.cat)} ({latestCategory.pct}%)
            </span>
          </p>
        )}
      </div>

      <div className="panel rounded-2xl p-4">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('stats.composicionCorporal')}
        </h2>
        <CompositionChart points={compPoints} />
        {latestComp && <CompositionDonut point={latestComp} />}
      </div>
    </>
  )
}
