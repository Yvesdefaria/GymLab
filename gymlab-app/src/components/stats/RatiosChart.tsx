// RatiosChart: WHtR y WHR con ChartCard, stats, umbral de riesgo y trend.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, CartesianGrid, Area, Legend, ReferenceLine } from 'recharts'
import { AnimatedAreaChart } from './AnimatedCharts'
import { ChartCard } from './ChartCard'
import { ChartTooltip } from './ChartTooltip'
import { RangePills } from './RangePills'
import { useStatsRange } from './StatsRangeContext'
import { StatRow, type StatItem } from './StatRow'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useDataColors } from '@/hooks/useDataColors'
import { axisTick } from './chartStyle'
import { inRange } from '@/domain/dates'
import { formatDayShort } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import { WHTR_LIMITS, WHR_LIMITS, type RatiosPoint } from '@/domain/calculators/bodyComposition'
import type { Sex } from '@/domain/types'


type Props = {
  points: RatiosPoint[]
  sex: Sex
}

export const RatiosChart = ({ points, sex }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const dataColors = useDataColors()
  const rangeCtx = useStatsRange()
  const { range } = rangeCtx

  const data = useMemo(() => {
    return points
      .filter((p) => inRange(p.date, range) && (p.whtr != null || p.whr != null))
      .map((p) => ({
        date: formatDayShort(p.date, lang),
        whtr: p.whtr != null ? Math.round(p.whtr * 1000) / 1000 : null,
        whr: p.whr != null ? Math.round(p.whr * 1000) / 1000 : null,
      }))
  }, [points, range, lang])

  const stats = useMemo((): StatItem[] => {
    const last = data.length > 0 ? data[data.length - 1] : null
    if (!last) return []
    const items: StatItem[] = []
    if (last.whtr != null && last.whtr > 0) items.push({ value: last.whtr, label: t('stats.whtrNombre'), format: 'decimal' })
    if (last.whr != null && last.whr > 0) items.push({ value: last.whr, label: t('stats.whrNombre'), format: 'decimal' })
    return items
  }, [data, t])

  const whrLimit = WHR_LIMITS[sex].low

  if (data.length === 0) {
    return (
      <ChartCard
        title={t('stats.ratiosCorto')}
        help="ratios"
        helpValues={{ whtrOk: WHTR_LIMITS.healthy, whtrMedio: WHTR_LIMITS.medium, whrHombre: WHR_LIMITS.male.low, whrMujer: WHR_LIMITS.female.low }}
      >
        <p className="py-4 text-center text-sm text-muted">{t('stats.ratiosSinDatos')}</p>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title={t('stats.ratiosCorto')}
      help="ratios"
      helpValues={{ whtrOk: WHTR_LIMITS.healthy, whtrMedio: WHTR_LIMITS.medium, whrHombre: WHR_LIMITS.male.low, whrMujer: WHR_LIMITS.female.low }}
      stats={<StatRow stats={stats} />}
      actions={rangeCtx.global ? undefined : <RangePills value={range} onChange={rangeCtx.setRange} />}
    >
      <AnimatedAreaChart data={data} height={220} label={t('stats.ratiosAria')} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="whtrGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={dataColors.core} stopOpacity={0.3} />
            <stop offset="95%" stopColor={dataColors.core} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="whrGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={dataColors.cardio} stopOpacity={0.3} />
            <stop offset="95%" stopColor={dataColors.cardio} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
        <ReferenceLine y={WHTR_LIMITS.healthy} stroke={colors.danger} strokeDasharray="6 4" strokeWidth={1} label={{ value: String(WHTR_LIMITS.healthy), position: 'right', fill: colors.danger, fontSize: 10 }} />
        <ReferenceLine y={whrLimit} stroke={colors.muted} strokeDasharray="3 3" strokeWidth={1} />
        <XAxis dataKey="date" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={12} interval="preserveStartEnd" />
        <YAxis tick={axisTick(colors)} axisLine={false} tickLine={false} width={36} domain={[0, 'auto']} />
        <ChartTooltip colors={colors} />
        <Legend />
        <Area type="monotone" dataKey="whtr" stroke={dataColors.core} strokeWidth={2} fill="url(#whtrGradient)" dot={{ r: 3, fill: dataColors.core, strokeWidth: 0 }} activeDot={{ r: 5, fill: dataColors.core, strokeWidth: 0, style: { outline: 'none' } }} name={t('stats.whtrNombre')} />
        <Area type="monotone" dataKey="whr" stroke={dataColors.cardio} strokeWidth={2} fill="url(#whrGradient)" dot={{ r: 3, fill: dataColors.cardio, strokeWidth: 0 }} activeDot={{ r: 5, fill: dataColors.cardio, strokeWidth: 0, style: { outline: 'none' } }} name={t('stats.whrNombre')} />
      </AnimatedAreaChart>
    </ChartCard>
  )
}
