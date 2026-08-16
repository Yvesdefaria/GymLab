// VolumeByMuscleChart: barras horizontales de volumen por grupo muscular con ChartCard y drill-down.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts'
import { AnimatedBarChart } from './AnimatedCharts'
import { ChartCard } from './ChartCard'
import { StatRow, type StatItem } from './StatRow'
import { DrillDownPanel, type DrillDownData } from './DrillDownPanel'
import { useThemeColors } from '@/hooks/useThemeColors'
import { axisTick, tooltipStyle, mobileBarGap } from './chartStyle'
import { chartPalette, CHART_HEIGHTS, Y_AXIS_WIDTH } from '@/domain/chartTokens'
import { formatVolume } from '@/domain/volume'
import { localizeMuscleGroup } from '@/i18n/catalog'
import type { MuscleVolume } from '@/domain/trainingStats'
import type { AppLanguage } from '@/domain/onboarding'

type Props = {
  data: MuscleVolume[]
}

export const VolumeByMuscleChart = ({ data }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const palette = chartPalette(colors)
  const [drillDown, setDrillDown] = useState<DrillDownData | null>(null)

  const stats = useMemo((): StatItem[] => {
    const total = data.reduce((s, d) => s + d.volume, 0)
    const topMuscle = data.length > 0 ? data.reduce((a, b) => (a.volume > b.volume ? a : b)) : null
    return [
      { value: total, label: t('stats.total'), format: 'volume' },
      { value: topMuscle?.volume ?? 0, label: topMuscle ? localizeMuscleGroup(topMuscle.muscle, lang) : '—', format: 'volume' },
      { value: data.length, label: t('stats.grupos') },
    ]
  }, [data, lang, t])

  if (data.length === 0) {
    return (
      <ChartCard title={t('stats.volumenMuscular')}>
        <p className="py-4 text-center text-sm text-muted">{t('stats.volumenMuscularSinDatos')}</p>
      </ChartCard>
    )
  }

  const handleBarClick = (muscleData: Record<string, unknown>) => {
    const total = data.reduce((s, d) => s + d.volume, 0)
    const vol = Number(muscleData.volume)
    const pct = total > 0 ? Math.round((vol / total) * 100) : 0
    setDrillDown({
      title: localizeMuscleGroup(String(muscleData.muscle), lang),
      subtitle: t('stats.detalleMusculo'),
      metrics: [
        { label: t('stats.volumen'), value: formatVolume(vol) },
        { label: t('stats.porcentaje'), value: `${pct}%` },
      ],
    })
  }

  return (
    <ChartCard
      title={t('stats.volumenMuscular')}
      stats={<StatRow stats={stats} />}
    >
      <AnimatedBarChart
        data={data}
        height={Math.min(data.length * 44, CHART_HEIGHTS.bar)}
        label={t('stats.volumenMuscularAria')}
        layout="vertical"
        margin={{ left: 0, right: 44, top: 4, bottom: 4 }}
        {...mobileBarGap}
      >
        <XAxis type="number" tick={axisTick(colors)} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="muscle"
          tick={{ fill: colors.muted, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={Y_AXIS_WIDTH}
          tickFormatter={(m: string) => localizeMuscleGroup(m, lang)}
        />
        <Tooltip
          cursor={{ fill: colors.bgElevated }}
          contentStyle={tooltipStyle(colors)}
          labelStyle={{ color: colors.muted }}
          itemStyle={{ color: colors.fg }}
          formatter={(value) => [formatVolume(Number(value)), t('stats.volumenTooltip')]}
        />
        <Bar dataKey="volume" radius={[0, 8, 8, 0]} maxBarSize={26} onClick={(d) => handleBarClick(d as unknown as Record<string, unknown>)} cursor="pointer">
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
          <LabelList
            dataKey="volume"
            position="right"
            offset={8}
            formatter={(v) => formatVolume(Number(v))}
            style={{ fill: colors.fg, fontSize: 11, fontWeight: 500 }}
          />
        </Bar>
      </AnimatedBarChart>

      <DrillDownPanel data={drillDown} onClose={() => setDrillDown(null)} />
    </ChartCard>
  )
}
