// Gráfico de evolución del peso corporal con rangos temporales y unidades del usuario (área con gradiente).
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, Tooltip, CartesianGrid, Area } from 'recharts'
import { AnimatedAreaChart } from '@/components/stats/AnimatedCharts'
import { RangePills } from '@/components/stats/RangePills'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { axisTick, tooltipStyle } from '@/components/stats/chartStyle'
import { applyUnits, formatUnits } from '@/domain/settings'
import { inRange, type StatsRange } from '@/domain/dates'
import { formatDayShort } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { BodyWeightEntry } from '@/domain/types'

type Props = {
  entries: BodyWeightEntry[]
}

export const BodyWeightChart = ({ entries }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const { settings } = useSettings()
  const [range, setRange] = useState<StatsRange>(30)

  const data = useMemo(() => {
    return entries
      .filter((e) => inRange(e.localDate, range))
      .map((e) => ({
        date: formatDayShort(e.localDate, lang),
        peso: Math.round(applyUnits(e.weightKg, settings.units) * 10) / 10,
      }))
  }, [entries, range, settings.units, lang])

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        {entries.length === 0 ? t('perfil.pesoSinDatos') : t('perfil.pesoSinRango')}
      </p>
    )
  }

  const min = Math.min(...data.map((d) => d.peso)) - 1
  const max = Math.max(...data.map((d) => d.peso)) + 1

  return (
    <div>
      <RangePills value={range} onChange={setRange} />

      <AnimatedAreaChart data={data} height={220} label={t('perfil.pesoChartLabel')} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.gold} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.gold} stopOpacity={0} />
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
        <YAxis
          domain={[min, max]}
          tick={axisTick(colors)}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}${formatUnits(settings.units)}`}
          width={36}
        />
        <Tooltip
          contentStyle={tooltipStyle(colors)}
          labelStyle={{ color: colors.muted }}
          itemStyle={{ color: colors.fg }}
          formatter={(value) => [`${value} ${formatUnits(settings.units)}`, t('perfil.pesoSeries')]}
        />
        <Area
          type="monotone"
          dataKey="peso"
          stroke={colors.gold}
          strokeWidth={2.5}
          fill="url(#weightGradient)"
          dot={{ r: 4, fill: colors.gold, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0 }}
        />
      </AnimatedAreaChart>
    </div>
  )
}
