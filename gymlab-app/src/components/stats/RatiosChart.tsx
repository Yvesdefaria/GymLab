// Evolución de ratios cintura/altura y cintura/cadera, con áreas y líneas de referencia de riesgo según sexo.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine, Area } from 'recharts'
import { AnimatedAreaChart } from './AnimatedCharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { axisTick, tooltipStyle } from './chartStyle'
import { RangePills } from './RangePills'
import { inRange, type StatsRange } from '@/domain/dates'
import { formatDayShort } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { RatiosPoint } from '@/domain/calculators/bodyComposition'
import type { Sex } from '@/domain/types'

type Props = {
  points: RatiosPoint[]
  sex: Sex
}

export const RatiosChart = ({ points, sex }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const [range, setRange] = useState<StatsRange>(30)
  const whrLimit = sex === 'male' ? 0.9 : 0.8

  const data = useMemo(
    () =>
      points
        .filter((p) => inRange(p.date, range))
        .map((p) => ({
          date: formatDayShort(p.date, lang),
          whtr: p.whtr,
          whr: p.whr,
        })),
    [points, range, lang],
  )

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        {points.length === 0
          ? t('stats.ratiosSinDatos')
          : t('stats.sinRango')}
      </p>
    )
  }

  return (
    <div>
      <RangePills value={range} onChange={setRange} />
      <AnimatedAreaChart data={data} height={240} label={t('stats.ratiosAria')} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="whtrGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.gold} stopOpacity={0.2} />
            <stop offset="95%" stopColor={colors.gold} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="whrGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.accent} stopOpacity={0.2} />
            <stop offset="95%" stopColor={colors.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={axisTick(colors)}
          axisLine={false}
          tickLine={false}
          minTickGap={12}
          interval="preserveStartEnd"
        />
        <YAxis domain={[0.3, 1.2]} tick={axisTick(colors)} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          contentStyle={tooltipStyle(colors)}
          labelStyle={{ color: colors.muted }}
          itemStyle={{ color: colors.fg }}
          />
        <Legend
          wrapperStyle={{ fontSize: 12, color: colors.muted }}
          formatter={(value) => <span style={{ color: colors.muted }}>{value}</span>}
        />
        <ReferenceLine
          y={0.5}
          stroke={colors.cta}
          strokeDasharray="4 4"
          label={{ value: 'WHtR 0.5', fill: colors.muted, fontSize: 10, position: 'insideTopRight' }}
        />
        <ReferenceLine
          y={whrLimit}
          stroke={colors.muted}
          strokeDasharray="4 4"
          label={{ value: `WHR ${whrLimit}`, fill: colors.muted, fontSize: 10, position: 'insideBottomRight' }}
        />
        <Area
          type="monotone"
          dataKey="whtr"
          name={t('stats.whtrNombre')}
          stroke={colors.gold}
          strokeWidth={2.5}
          fill="url(#whtrGradient)"
          dot={{ r: 4, fill: colors.gold, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0 }}
          connectNulls
        />
        <Area
          type="monotone"
          dataKey="whr"
          name={t('stats.whrNombre')}
          stroke={colors.accent}
          strokeWidth={2.5}
          fill="url(#whrGradient)"
          dot={{ r: 4, fill: colors.accent, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0 }}
          connectNulls
        />
      </AnimatedAreaChart>
    </div>
  )
}
