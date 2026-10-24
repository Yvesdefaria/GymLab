// Evolución del peso dentro del rango activo: área editorial de 110 px, sin grilla,
// con tres marcas por eje y la fila Mín./Máx./Cambio. Usa los datos reales y las unidades
// configuradas; el rango lo decide la página (30/90/Todo).
import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, XAxis, YAxis } from 'recharts'
import { AnimatedAreaChart } from '@/components/stats/AnimatedCharts'
import { ChartTooltip } from '@/components/stats/ChartTooltip'
import { DrillDownPanel, type DrillDownData } from '@/components/stats/DrillDownPanel'
import { StatsSection } from '@/components/stats/StatsSection'
import { StatsStatRow } from '@/components/stats/StatsStatRow'
import { axisTick, showAreaDots } from '@/components/stats/chartStyle'
import { useThemeColors } from '@/hooks/useThemeColors'
import { applyUnits, formatUnits, type Units } from '@/domain/settings'
import { formatDayShort } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { WeightSummary } from '@/domain/bodyProgress'
import type { BodyWeightEntry } from '@/domain/types'

type Props = {
  entries: BodyWeightEntry[]
  summary: WeightSummary
  units: Units
  lang: AppLanguage
}

export const WeightEvolution = ({ entries, summary, units, lang }: Props) => {
  const { t } = useTranslation()
  const colors = useThemeColors()
  const gradientId = useId().replace(/:/g, '')
  const [drillDown, setDrillDown] = useState<DrillDownData | null>(null)

  const data = useMemo(
    () =>
      [...entries]
        .sort((a, b) => a.localDate.localeCompare(b.localDate))
        .map((e) => ({
          date: formatDayShort(e.localDate, lang),
          rawDate: e.localDate,
          peso: Math.round(applyUnits(e.weightKg, units) * 10) / 10,
        })),
    [entries, lang, units],
  )

  const countLabel =
    summary.count === 1
      ? t('peso.unRegistro')
      : t('peso.nRegistros', { count: summary.count })

  if (data.length === 0) {
    return (
      <StatsSection title={t('peso.evolucion')} meta={countLabel}>
        <p className="py-4 text-center text-sm text-muted">{t('peso.sinDatosRango')}</p>
      </StatsSection>
    )
  }

  const values = data.map((d) => d.peso)
  const min = Math.min(...values) - 1
  const max = Math.max(...values) + 1
  const unit = formatUnits(units)
  const last = data[data.length - 1].peso
  // Tres marcas de fecha como máximo: inicio, medio y fin del rango.
  const ticks =
    data.length <= 3
      ? data.map((d) => d.date)
      : [data[0].date, data[Math.floor((data.length - 1) / 2)].date, data[data.length - 1].date]
  const chartLabel = t('peso.chartAria', {
    count: data.length,
    min: Math.min(...values),
    max: Math.max(...values),
    last,
  })

  const stat = (value: number | null, sign = false) =>
    value === null
      ? '—'
      : `${sign && value > 0 ? '+' : ''}${applyUnits(value, units).toFixed(1)} ${unit}`

  return (
    <StatsSection title={t('peso.evolucion')} meta={countLabel}>
      <AnimatedAreaChart
        data={data}
        height={110}
        label={chartLabel}
        margin={{ top: 6, right: 2, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.gold} stopOpacity={0.26} />
            <stop offset="95%" stopColor={colors.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          ticks={ticks}
          tick={axisTick(colors)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[min, max]}
          tickCount={3}
          width={30}
          tick={axisTick(colors)}
          axisLine={false}
          tickLine={false}
        />
        <ChartTooltip
          colors={colors}
          formatter={(value) => [`${value} ${unit}`, t('peso.evolucion')]}
        />
        <Area
          type="monotone"
          dataKey="peso"
          stroke={colors.gold}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={showAreaDots(data.length) ? { r: 3, fill: colors.gold, strokeWidth: 0 } : false}
          activeDot={{ r: 5, fill: colors.cta, strokeWidth: 0, style: { outline: 'none' } }}
          onClick={(point) => {
            const payload = point as unknown as { peso: number; date: string }
            setDrillDown({
              title: payload.date,
              subtitle: t('peso.evolucion'),
              metrics: [{ label: t('peso.evolucion'), value: `${payload.peso} ${unit}` }],
            })
          }}
        />
      </AnimatedAreaChart>

      <StatsStatRow
        items={[
          { value: stat(summary.minKg), label: t('peso.min') },
          { value: stat(summary.maxKg), label: t('peso.max') },
          { value: stat(summary.deltaKg, true), label: t('peso.cambio') },
        ]}
      />

      <DrillDownPanel data={drillDown} onClose={() => setDrillDown(null)} />
    </StatsSection>
  )
}
