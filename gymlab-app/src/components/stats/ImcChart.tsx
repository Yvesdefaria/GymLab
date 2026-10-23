// ImcChart: evolución IMC con ChartCard, stats, zonas de riesgo y trend.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, CartesianGrid, Area, ReferenceArea } from 'recharts'
import { AnimatedAreaChart } from './AnimatedCharts'
import { ChartCard } from './ChartCard'
import { ChartTooltip } from './ChartTooltip'
import { RangePills } from './RangePills'
import { StatRow, type StatItem } from './StatRow'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useDataColors } from '@/hooks/useDataColors'
import { axisTick } from './chartStyle'
import { inRange, type StatsRange } from '@/domain/dates'
import { IMC_THRESHOLDS } from '@/domain/calculators/imc'
import { formatDayShort } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { ImcPoint } from '@/domain/calculators/bodyComposition'

type Props = {
  points: ImcPoint[]
}

export const ImcChart = ({ points }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const dataColors = useDataColors()
  const [range, setRange] = useState<StatsRange>(30)

  const data = useMemo(() => {
    return points
      .filter((p) => inRange(p.date, range))
      .map((p) => ({
        date: formatDayShort(p.date, lang),
        imc: Math.round(p.imc * 10) / 10,
      }))
  }, [points, range, lang])

  const stats = useMemo((): StatItem[] => {
    const last = data.length > 0 ? data[data.length - 1] : null
    if (!last) return []
    return [
      { value: last.imc, label: t('stats.imcCorto'), format: 'decimal' },
    ]
  }, [data])

  if (data.length === 0) {
    return (
      <ChartCard
        title={t('stats.imcTitulo')}
        help="imc"
        helpValues={{ bajo: IMC_THRESHOLDS[0]!, normal: IMC_THRESHOLDS[1]!, sobrepeso: IMC_THRESHOLDS[2]! }}
      >
        <p className="py-4 text-center text-sm text-muted">{t('stats.imcSinDatos')}</p>
      </ChartCard>
    )
  }

  const min = Math.min(...data.map((d) => d.imc)) - 1
  const max = Math.max(...data.map((d) => d.imc)) + 1

  return (
    <ChartCard
      title={t('stats.imcTitulo')}
      help="imc"
      helpValues={{ bajo: IMC_THRESHOLDS[0]!, normal: IMC_THRESHOLDS[1]!, sobrepeso: IMC_THRESHOLDS[2]! }}
      stats={<StatRow stats={stats} />}
      actions={<RangePills value={range} onChange={setRange} />}
    >
      <AnimatedAreaChart data={data} height={220} label={t('stats.imcAria')} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="imcGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={dataColors.cardio} stopOpacity={0.3} />
            <stop offset="95%" stopColor={dataColors.cardio} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
        {/* Health zone reference areas */}
        {min < 25 && max > 18.5 && (
          <ReferenceArea y1={18.5} y2={25} fill={dataColors.cardio} fillOpacity={0.06} />
        )}
        <XAxis dataKey="date" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={12} interval="preserveStartEnd" />
        <YAxis domain={[min, max]} tick={axisTick(colors)} axisLine={false} tickLine={false} width={36} />
        <ChartTooltip colors={colors} formatter={(value) => [value, t('stats.imcTooltip')]} />
        <Area type="monotone" dataKey="imc" stroke={dataColors.cardio} strokeWidth={2.5} fill="url(#imcGradient)" dot={{ r: 4, fill: dataColors.cardio, strokeWidth: 0 }} activeDot={{ r: 6, fill: dataColors.cardio, strokeWidth: 0, style: { outline: 'none' } }} />
      </AnimatedAreaChart>
    </ChartCard>
  )
}
