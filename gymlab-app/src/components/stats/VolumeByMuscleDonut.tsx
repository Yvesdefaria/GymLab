// VolumeByMuscleDonut: dona de reparto de volumen con ChartCard, centro animado y leyenda interactiva.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pie, Cell, Tooltip } from 'recharts'
import { AnimatedDonut } from './AnimatedCharts'
import { ChartCard } from './ChartCard'
import { StatRow, type StatItem } from './StatRow'
import { useThemeColors } from '@/hooks/useThemeColors'
import { tooltipStyle } from './chartStyle'
import { chartPalette, CHART_HEIGHTS } from '@/domain/chartTokens'
import { formatVolume } from '@/domain/volume'
import { localizeMuscleGroup } from '@/i18n/catalog'
import type { MuscleVolume } from '@/domain/trainingStats'
import type { AppLanguage } from '@/domain/onboarding'

type Props = {
  data: MuscleVolume[]
}

export const VolumeByMuscleDonut = ({ data }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const palette = chartPalette(colors)
  const [hiddenMuscles, setHiddenMuscles] = useState<Set<string>>(new Set())

  const total = useMemo(() => data.reduce((acc, d) => acc + d.volume, 0), [data])
  const visibleData = useMemo(() => data.filter((d) => !hiddenMuscles.has(d.muscle)), [data, hiddenMuscles])
  const visibleTotal = useMemo(() => visibleData.reduce((acc, d) => acc + d.volume, 0), [visibleData])

  const stats = useMemo((): StatItem[] => {
    const topMuscle = data.length > 0 ? data.reduce((a, b) => (a.volume > b.volume ? a : b)) : null
    const topPct = topMuscle && total > 0 ? Math.round((topMuscle.volume / total) * 100) : 0
    return [
      { value: total, label: t('stats.total'), format: 'volume' },
      { value: topPct, label: topMuscle ? localizeMuscleGroup(topMuscle.muscle, lang) : '—', format: 'percent' },
    ]
  }, [data, total, lang, t])

  const toggleMuscle = (muscle: string) => {
    setHiddenMuscles((prev) => {
      const next = new Set(prev)
      if (next.has(muscle)) next.delete(muscle)
      else next.add(muscle)
      return next
    })
  }

  if (data.length === 0) {
    return (
      <ChartCard title={t('stats.volumenMuscular')}>
        <p className="py-4 text-center text-sm text-muted">{t('stats.volumenDonutSinDatos')}</p>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title={t('stats.volumenMuscular')}
      stats={<StatRow stats={stats} />}
    >
      <div
        className="relative"
        role="img"
        aria-label={t('stats.volumenDonutAria', {
          detalle: data
            .map((d) => `${localizeMuscleGroup(d.muscle, lang)} ${formatVolume(d.volume)}`)
            .join(', '),
        })}
      >
        <AnimatedDonut width="100%" height={CHART_HEIGHTS.donut}>
          <Pie
            data={visibleData}
            dataKey="volume"
            nameKey="muscle"
            innerRadius={54}
            outerRadius={80}
            paddingAngle={2}
            stroke="none"
          >
            {visibleData.map((d) => {
              const origIdx = data.findIndex((x) => x.muscle === d.muscle)
              return <Cell key={d.muscle} fill={palette[origIdx % palette.length]} />
            })}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle(colors)}
            labelStyle={{ color: colors.muted }}
            itemStyle={{ color: colors.fg }}
            formatter={(value, _name, item) => {
              const pct = visibleTotal > 0 ? Math.round((Number(value) / visibleTotal) * 100) : 0
              return [`${formatVolume(Number(value))} · ${pct}%`, localizeMuscleGroup((item as { payload?: { muscle?: string } }).payload?.muscle ?? '', lang)]
            }}
          />
        </AnimatedDonut>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[0.65rem] uppercase tracking-wide text-muted">{t('stats.total')}</p>
          <p className="font-display text-lg font-semibold text-fg">{formatVolume(visibleTotal)}</p>
        </div>
      </div>

      {/* Interactive legend: tap to toggle */}
      <ul className="mt-3 space-y-1 text-sm">
        {data.map((d, i) => {
          const isHidden = hiddenMuscles.has(d.muscle)
          const pct = total > 0 ? Math.round((d.volume / total) * 100) : 0
          return (
            <li key={d.muscle}>
              <button
                onClick={() => toggleMuscle(d.muscle)}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 transition-colors ${
                  isHidden ? 'opacity-40' : 'hover:bg-bg-elevated/50'
                }`}
              >
                <span className="flex items-center gap-2 text-muted">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: palette[i % palette.length] }} aria-hidden />
                  {localizeMuscleGroup(d.muscle, lang)}
                </span>
                <span className="font-medium text-fg">
                  {formatVolume(d.volume)} ({pct}%)
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </ChartCard>
  )
}
