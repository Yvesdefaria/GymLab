// Barras redondeadas del volumen semanal total — reemplaza el área plana, valor visible encima de cada barra.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, Tooltip, CartesianGrid, Bar, Cell, LabelList } from 'recharts'
import { AnimatedBarChart } from '@/components/stats/AnimatedCharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { tooltipStyle, axisTick } from '@/components/stats/chartStyle'
import { applyUnits, formatUnits } from '@/domain/settings'
import { formatVolume } from '@/domain/volume'
import { buildWeeklyVolumeSeries } from '@/domain/trainingStats'
import { formatDayShort } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { Workout } from '@/domain/types'

type VolumeChartProps = {
  workouts: Workout[]
}

export const VolumeChart = ({ workouts }: VolumeChartProps) => {
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

  if (workouts.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">{t('perfil.volumenSinDatos')}</p>
    )
  }

  // Direct labeling: label visible solo si hay ≤6 barras (suficiente espacio entre ellas).
  const showLabels = data.length <= 6

  return (
    <AnimatedBarChart
      data={data}
      height={240}
      label={t('perfil.volumenChartLabel')}
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
          t('perfil.volumenSeries'),
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
  )
}
