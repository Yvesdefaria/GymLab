// Dona de reparto del volumen por grupo muscular: total en el centro, leyenda con % y tooltip por sector (animado).
import { useTranslation } from 'react-i18next'
import { Pie, Cell, Tooltip } from 'recharts'
import { AnimatedDonut } from './AnimatedCharts'
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

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        {t('stats.volumenDonutSinDatos')}
      </p>
    )
  }

  const total = data.reduce((acc, d) => acc + d.volume, 0)

  return (
    <div>
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
            data={data}
            dataKey="volume"
            nameKey="muscle"
            innerRadius={54}
            outerRadius={80}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle(colors)}
            labelStyle={{ color: colors.muted }}
            itemStyle={{ color: colors.fg }}
            formatter={(value, _name, item) => {
              const pct = total > 0 ? Math.round((Number(value) / total) * 100) : 0
              return [`${formatVolume(Number(value))} · ${pct}%`, localizeMuscleGroup((item as { payload?: { muscle?: string } }).payload?.muscle ?? '', lang)]
            }}
          />
        </AnimatedDonut>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[0.65rem] uppercase tracking-wide text-muted">{t('stats.total')}</p>
          <p className="font-display text-lg font-semibold text-fg">{formatVolume(total)}</p>
        </div>
      </div>
      <ul className="mt-2 space-y-1 text-sm">
        {data.map((d, i) => (
          <li key={d.muscle} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: palette[i % palette.length] }} aria-hidden />
              {localizeMuscleGroup(d.muscle, lang)}
            </span>
            <span className="font-medium text-fg">
              {formatVolume(d.volume)} ({total > 0 ? Math.round((d.volume / total) * 100) : 0}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
