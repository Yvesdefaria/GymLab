// Barras horizontales de volumen por grupo muscular, con paleta token-based y etiquetas de volumen al final (animado).
import { useTranslation } from 'react-i18next'
import { Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts'
import { AnimatedBarChart } from './AnimatedCharts'
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

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        {t('stats.volumenMuscularSinDatos')}
      </p>
    )
  }

  return (
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
      <Bar dataKey="volume" radius={[0, 8, 8, 0]} maxBarSize={26}>
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
  )
}
