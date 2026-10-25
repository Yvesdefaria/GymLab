// E1rmChart: evolución 1RM estimado con ChartCard, stats y PR marker.
import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, CartesianGrid, Area, ReferenceDot } from 'recharts'
import { AnimatedAreaChart } from '@/components/stats/AnimatedCharts'
import { ChartCard } from '@/components/stats/ChartCard'
import { ChartTooltip } from '@/components/stats/ChartTooltip'
import { StatRow, type StatItem } from '@/components/stats/StatRow'
import { TrendBadge } from '@/components/stats/TrendBadge'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useSettings } from '@/hooks/useSettings'
import { axisTick } from '@/components/stats/chartStyle'
import { applyUnits, formatUnits } from '@/domain/settings'
import { formatNumber } from '@/lib/intl'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { E1rmPoint } from '@/domain/e1rm'

type E1rmChartProps = {
  points: E1rmPoint[]
  /** Selector de ejercicio que se muestra arriba del gráfico en /estadisticas. */
  selector?: ReactNode
  /** `minimal` quita el ChartCard para la ficha de ejercicio (héroe + área de 104 px). */
  variant?: 'card' | 'minimal'
}

export const E1rmChart = ({ points, selector, variant = 'card' }: E1rmChartProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const { settings } = useSettings()

  const data = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        label: formatDate(p.date, lang, { day: 'numeric', month: 'short' }),
        displayValue: Math.round(applyUnits(p.estimated1RM, settings.units)),
      })),
    [points, lang, settings.units],
  )

  const stats = useMemo((): StatItem[] => {
    if (data.length === 0) return []
    const current = data[data.length - 1].displayValue
    return [
      { value: current, label: '1RM', format: 'decimal' as const, suffix: ` ${formatUnits(settings.units)}` },
    ]
  }, [data, settings.units])

  const trendPct = useMemo(() => {
    if (data.length < 2) return 0
    const first = data[0].displayValue
    const last = data[data.length - 1].displayValue
    return first !== 0 ? ((last - first) / first) * 100 : 0
  }, [data])

  // Solo mostramos el badge si el último punto supera el máximo previo (PR real).
  const prDelta = useMemo(() => {
    if (data.length < 2) return null
    const latest = data[data.length - 1]
    const previousMax = data
      .slice(0, -1)
      .reduce((max, point) => Math.max(max, point.estimated1RM), 0)
    if (latest.estimated1RM <= previousMax) return null
    const delta =
      latest.displayValue - Math.round(applyUnits(previousMax, settings.units))
    return delta > 0 ? delta : null
  }, [data, settings.units])

  if (data.length === 0) {
    return (
      <ChartCard title={t('stats.fuerzaEstimada')} help="e1rm">
        <p className="py-4 text-center text-sm text-muted">{t('stats.sinSeries1rm')}</p>
      </ChartCard>
    )
  }

  // Ficha de ejercicio: el dato manda; la gráfica va sin card, sin grilla y sin eje Y.
  if (variant === 'minimal') {
    const current = data[data.length - 1]
    return (
      <section className="border-t border-border/40 pt-4" data-testid="e1rm-minimal">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {t('stats.fuerzaEstimada')}
          </h2>
          {prDelta != null ? (
            <span className="text-[9px] font-semibold text-success">
              PR +{formatNumber(prDelta, lang)} {formatUnits(settings.units)}
            </span>
          ) : (
            <span className="text-[9px] text-muted">{t('stats.ultimoLeyenda')}</span>
          )}
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <strong className="font-display text-2xl font-light tabular-nums text-fg">
            {current.displayValue} <span className="text-xs text-muted">{formatUnits(settings.units)}</span>
          </strong>
          {trendPct !== 0 ? (
            <span className={`text-[10px] tabular-nums ${trendPct > 0 ? 'text-gold-bright' : 'text-muted'}`}>
              {trendPct > 0 ? '+' : ''}
              {formatNumber(trendPct, lang, { maximumFractionDigits: 1 })} %
            </span>
          ) : null}
        </div>
        <AnimatedAreaChart
          data={data}
          height={104}
          label={t('perfil.e1rmChartLabel')}
          margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="e1rmGradientMinimal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.gold} stopOpacity={0.38} />
              <stop offset="100%" stopColor={colors.gold} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={axisTick(colors)}
            axisLine={false}
            tickLine={false}
            minTickGap={16}
            interval="preserveStartEnd"
          />
          <ChartTooltip
            colors={colors}
            formatter={(value) => [
              `${Math.round(applyUnits(Number(value), settings.units))} ${formatUnits(settings.units)}`,
              t('perfil.e1rmSeries'),
            ]}
          />
          <Area
            type="monotone"
            dataKey="estimated1RM"
            stroke={colors.gold}
            strokeWidth={2}
            fill="url(#e1rmGradientMinimal)"
            dot={false}
            activeDot={{ r: 5, fill: colors.cta, strokeWidth: 0, style: { outline: 'none' } }}
          />
          <ReferenceDot x={current.label} y={current.estimated1RM} r={4} fill={colors.cta} stroke="none" />
        </AnimatedAreaChart>
        <div className="flex justify-between pt-1 text-[8px] text-muted">
          <span>{data[0].label}</span>
          <span>{current.label}</span>
        </div>
      </section>
    )
  }

  return (
    <ChartCard
      title={t('stats.fuerzaEstimada')}
      help="e1rm"
      meta={
        prDelta != null ? (
          <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[9px] font-semibold text-success">
            PR +{formatNumber(prDelta, lang)} {formatUnits(settings.units)}
          </span>
        ) : undefined
      }
      stats={
        <>
          {selector}
          <StatRow stats={stats} />
        </>
      }
      footer={trendPct !== 0 ? <TrendBadge value={trendPct} label="total" /> : undefined}
    >
      <AnimatedAreaChart data={data} height={220} label={t('perfil.e1rmChartLabel')} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="e1rmGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.gold} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={12} interval="preserveStartEnd" />
        <YAxis tick={axisTick(colors)} axisLine={false} tickLine={false} tickFormatter={(v) => String(Math.round(applyUnits(Number(v), settings.units)))} width={36} />
        <ChartTooltip
          colors={colors}
          formatter={(value) => [`${Math.round(applyUnits(Number(value), settings.units))} ${formatUnits(settings.units)}`, t('perfil.e1rmSeries')]}
        />
        <Area type="monotone" dataKey="estimated1RM" stroke={colors.gold} strokeWidth={2.5} fill="url(#e1rmGradient)" dot={{ r: 4, fill: colors.gold, strokeWidth: 0 }} activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0, style: { outline: 'none' } }} />
        <ReferenceDot x={data[data.length - 1].label} y={data[data.length - 1].estimated1RM} r={5} fill={colors.cta} stroke="none" />
      </AnimatedAreaChart>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted">
        <span className="size-2 rounded-full bg-cta" aria-hidden />
        {t('stats.ultimoLeyenda')}
      </p>
    </ChartCard>
  )
}
