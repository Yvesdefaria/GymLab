// Evolución del 1RM estimado por ejercicio en área con gradiente — reemplaza la línea plana.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, Tooltip, CartesianGrid, Area, ReferenceDot } from 'recharts'
import { AnimatedAreaChart } from '@/components/stats/AnimatedCharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { tooltipStyle, axisTick } from '@/components/stats/chartStyle'
import { applyUnits, formatUnits } from '@/domain/settings'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { E1rmPoint } from '@/domain/e1rm'

type E1rmChartProps = {
  points: E1rmPoint[]
}

export const E1rmChart = ({ points }: E1rmChartProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const { settings } = useSettings()

  const data = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        label: formatDate(p.date, lang, { day: 'numeric', month: 'short' }),
      })),
    [points, lang],
  )

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        {t('perfil.e1rmSinDatos')}
      </p>
    )
  }

  return (
    <AnimatedAreaChart data={data} height={220} label={t('perfil.e1rmChartLabel')} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="e1rmGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={colors.gold} stopOpacity={0.3} />
          <stop offset="95%" stopColor={colors.gold} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
      <XAxis
        dataKey="label"
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
        tickFormatter={(v) => String(Math.round(applyUnits(Number(v), settings.units)))}
        width={36}
      />
      <Tooltip
        contentStyle={tooltipStyle(colors)}
        labelStyle={{ color: colors.muted }}
        itemStyle={{ color: colors.fg }}
        formatter={(value) => [
          `${Math.round(applyUnits(Number(value), settings.units))} ${formatUnits(settings.units)}`,
          t('perfil.e1rmSeries'),
        ]}
      />
      <Area
        type="monotone"
        dataKey="estimated1RM"
        stroke={colors.gold}
        strokeWidth={2.5}
        fill="url(#e1rmGradient)"
        dot={{ r: 4, fill: colors.gold, strokeWidth: 0 }}
        activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0 }}
      />
      <ReferenceDot
        x={data[data.length - 1].label}
        y={data[data.length - 1].estimated1RM}
        r={5}
        fill={colors.cta}
        stroke="none"
      />
    </AnimatedAreaChart>
  )
}
