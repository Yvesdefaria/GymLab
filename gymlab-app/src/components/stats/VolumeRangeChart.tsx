// Barras redondeadas del volumen total por semana — reemplaza las velas OHLC de volumen.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatedBarChart } from './AnimatedCharts'
import { XAxis, YAxis, Tooltip, CartesianGrid, Bar, Cell, LabelList } from 'recharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { axisTick, tooltipStyle } from './chartStyle'
import type { Workout } from '@/domain/types'
import { applyUnits, formatUnits } from '@/domain/settings'
import { formatVolume } from '@/domain/volume'
import { buildWeeklyVolumeSeries } from '@/domain/trainingStats'
import { formatDayShort } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

type Props = {
  workouts: Workout[]
}

export const VolumeRangeChart = ({ workouts }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const { settings } = useSettings()

  const data = useMemo(() => {
    return buildWeeklyVolumeSeries(workouts).map((p) => ({
      week: formatDayShort(p.week, lang),
      volume: p.volume,
    }))
  }, [workouts, lang])

  if (data.length === 0) {
    return <p className="py-4 text-center text-sm text-muted">{t('stats.sinSesiones')}</p>
  }

  const showLabels = data.length <= 6

  return (
    <div role="img" aria-label={t('stats.rangoVolumenAria')}>
      <AnimatedBarChart
        data={data}
        height={240}
        barCategoryGap="22%"
        margin={{ top: showLabels ? 28 : 8, right: 4, left: 0, bottom: 0 }}
      >
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="week"
          tick={axisTick(colors)}
          axisLine={false}
          tickLine={false}
          minTickGap={12}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={axisTick(colors)}
          axisLine={false}
          tickLine={false}
          width={36}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={tooltipStyle(colors)}
          labelStyle={{ color: colors.muted }}
          itemStyle={{ color: colors.fg }}
          formatter={(value) => [
            `${Math.round(applyUnits(Number(value), settings.units)).toLocaleString()} ${formatUnits(settings.units)}`,
            t('stats.volumenTooltip'),
          ]}
        />
        <Bar dataKey="volume" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === data.length - 1 ? colors.cta : colors.gold} />
          ))}
          {showLabels && (
            <LabelList
              dataKey="volume"
              position="top"
              offset={6}
              formatter={(v) => formatVolume(Number(v))}
              style={{ fill: colors.fg, fontSize: 11, fontWeight: 500 }}
            />
          )}
        </Bar>
      </AnimatedBarChart>
    </div>
  )
}
