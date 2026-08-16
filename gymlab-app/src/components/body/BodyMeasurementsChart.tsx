// Gráfico de evolución de medidas corporales con selector de zona y de rango temporal — área con gradiente.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, Tooltip, CartesianGrid, Area } from 'recharts'
import { AnimatedAreaChart } from '@/components/stats/AnimatedCharts'
import { RangePills } from '@/components/stats/RangePills'
import { useThemeColors } from '@/hooks/useThemeColors'
import { axisTick, tooltipStyle } from '@/components/stats/chartStyle'
import { BODY_ZONES } from '@/domain/bodyMeasurements'
import { inRange, type StatsRange } from '@/domain/dates'
import { formatDayShort } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { BodyMeasurementEntry, BodyZone } from '@/domain/types'

type Props = {
  entries: BodyMeasurementEntry[]
}

export const BodyMeasurementsChart = ({ entries }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const [zone, setZone] = useState<BodyZone>('cintura')
  const [range, setRange] = useState<StatsRange>(30)

  const data = useMemo(() => {
    return entries
      .filter((e) => {
        const v = e.values[zone]
        if (v == null) return false
        return inRange(e.localDate, range)
      })
      .map((e) => ({
        date: formatDayShort(e.localDate, lang),
        valor: e.values[zone] as number,
      }))
  }, [entries, zone, range, lang])

  return (
    <div>
      <div className="mb-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <div className="flex w-max gap-2">
          {BODY_ZONES.map((z) => (
            <button
              key={z.key}
              onClick={() => setZone(z.key)}
              aria-pressed={zone === z.key}
              className={`inline-flex min-h-[44px] items-center rounded-full border px-3 text-xs font-medium transition-colors ${
                zone === z.key
                  ? 'border-cta bg-cta/20 text-accent-soft'
                  : 'border-border text-muted hover:border-cta'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      <RangePills value={range} onChange={setRange} />

      {data.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">
          {entries.length === 0
            ? t('stats.medidasSinDatos')
            : t('stats.medidasSinZona')}
        </p>
      ) : (
        <AnimatedAreaChart data={data} height={220} label={t('stats.medidasAria')} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="measurementsGradient" x1="0" y1="0" x2="0" y2="1">
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
            domain={[Math.min(...data.map((d) => d.valor)) - 1, Math.max(...data.map((d) => d.valor)) + 1]}
            tick={axisTick(colors)}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={tooltipStyle(colors)}
            labelStyle={{ color: colors.muted }}
            itemStyle={{ color: colors.fg }}
            formatter={(value) => [`${value} cm`, BODY_ZONES.find((z) => z.key === zone)?.label]}
          />
          <Area
            type="monotone"
            dataKey="valor"
            stroke={colors.gold}
            strokeWidth={2.5}
            fill="url(#measurementsGradient)"
            dot={{ r: 4, fill: colors.gold, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0 }}
          />
        </AnimatedAreaChart>
      )}
    </div>
  )
}
