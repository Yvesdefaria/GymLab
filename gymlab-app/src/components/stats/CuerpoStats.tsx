// Pestaña de composición corporal (C1): héroe de peso + stats y stack de
// secciones con hairlines. Conserva peso, IMC, medidas, ratios, grasa y
// composición; los charts se compactan por el contexto minimal de ChartCard.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CompositionChart } from './CompositionChart'
import { CompositionDonut } from './CompositionDonut'
import { ImcChart } from './ImcChart'
import { RatiosChart } from './RatiosChart'
import { StatsHero } from './StatsHero'
import { StatsStatRow } from './StatsStatRow'
import { StatsRangeBar } from './StatsRangeBar'
import { BodyWeightChart } from '@/components/profile/BodyWeightChart'
import { BodyMeasurementsChart } from '@/components/body/BodyMeasurementsChart'
import { SkinfoldChart } from '@/components/body/SkinfoldChart'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits } from '@/domain/settings'
import { addLocalDays, toLocalDateStr } from '@/domain/dates'
import { formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import {
  buildBodyCompSeries,
  buildImcSeries,
  buildRatiosSeries,
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

export const CuerpoStats = ({
  weightEntries,
  measurementEntries,
  skinfoldEntries,
  heightCm,
  sex,
}: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { settings } = useSettings()

  const imcPoints = useMemo(() => buildImcSeries(weightEntries, heightCm), [weightEntries, heightCm])
  const ratiosPoints = useMemo(
    () => buildRatiosSeries(measurementEntries, heightCm),
    [measurementEntries, heightCm],
  )
  const compPoints = useMemo(
    () => buildBodyCompSeries(skinfoldEntries, heightCm),
    [skinfoldEntries, heightCm],
  )
  const latestComp = compPoints[compPoints.length - 1]
  const latestCategory = useMemo(() => latestBodyFat(skinfoldEntries), [skinfoldEntries])

  const today = toLocalDateStr()
  const latestWeight = weightEntries.at(-1)
  const cutoff = addLocalDays(today, -30)
  const baseWeight = weightEntries.find((entry) => entry.localDate >= cutoff)
  const deltaKg =
    latestWeight && baseWeight && latestWeight.localDate !== baseWeight.localDate
      ? latestWeight.weightKg - baseWeight.weightKg
      : null

  const weightValue = latestWeight
    ? formatNumber(applyUnits(latestWeight.weightKg, settings.units), lang, {
        maximumFractionDigits: 1,
      })
    : '—'
  const weightUnit = formatUnits(settings.units)
  const weightDelta =
    deltaKg != null
      ? t('stats.delta30d', {
          delta: `${deltaKg > 0 ? '+' : ''}${formatNumber(deltaKg, lang, {
            maximumFractionDigits: 1,
          })}`,
        })
      : undefined

  const imcLatest = imcPoints.at(-1)?.imc
  const ratioLatest = ratiosPoints.at(-1)?.whr
  const bodyStats = [
    {
      value:
        imcLatest != null
          ? formatNumber(imcLatest, lang, { maximumFractionDigits: 1 })
          : '—',
      label: t('stats.imcCorto'),
      color: 'bg-data-cardio',
    },
    {
      value: latestCategory
        ? `${formatNumber(latestCategory.pct, lang, { maximumFractionDigits: 1 })}%`
        : '—',
      label: t('stats.grasaCorto'),
      color: 'bg-data-fat',
    },
    {
      value:
        ratioLatest != null
          ? formatNumber(ratioLatest, lang, { maximumFractionDigits: 2 })
          : '—',
      label: t('stats.ratioCorto'),
      color: 'bg-data-core',
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <StatsRangeBar />
      <StatsHero
        eyebrow={t('stats.heroPesoActual')}
        value={weightValue}
        unit={weightUnit}
        delta={weightDelta}
        deltaTone="progress"
      />
      <StatsStatRow items={bodyStats} />

      <BodyWeightChart entries={weightEntries} />
      <ImcChart points={imcPoints} />
      <BodyMeasurementsChart entries={measurementEntries} />
      <RatiosChart points={ratiosPoints} sex={sex} />
      <SkinfoldChart entries={skinfoldEntries} />
      {latestCategory && (
        <p className="text-center text-[10px] text-muted">
          {t('stats.ultimaCategoria')}
          <span className="font-medium text-fg">
            {t(`stats.bodyFatCategory.${latestCategory.cat}` as any)} ({latestCategory.pct}%)
          </span>
        </p>
      )}
      <CompositionChart points={compPoints} />
      {latestComp && <CompositionDonut point={latestComp} />}
    </div>
  )
}
