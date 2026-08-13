// Gráfico de evolución del % de grasa corporal estimado con pliegues (Jackson-Pollock) — área con gradiente.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XAxis, YAxis, Tooltip, CartesianGrid, Area } from 'recharts'
import { AnimatedAreaChart } from '@/components/stats/AnimatedCharts'
import { useThemeColors } from '@/hooks/useThemeColors'
import { axisTick, tooltipStyle } from '@/components/stats/chartStyle'
import { calcJacksonPollock } from '@/domain/calculators/bodyComposition'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { SkinfoldEntry } from '@/domain/types'

type Range = 30 | 90 | 0

type Props = {
  entries: SkinfoldEntry[]
}

export const SkinfoldChart = ({ entries }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()
  const [range, setRange] = useState<Range>(30)

  const ranges: { value: Range; label: string }[] = [
    { value: 30, label: '30 d' },
    { value: 90, label: '90 d' },
    { value: 0, label: t('stats.rangoTodo') },
  ]

  const data = useMemo(() => {
    const DAY = 86_400_000
    const cutoff = range === 0 ? 0 : Date.now() - range * DAY
    return entries
      .map((e) => {
        const r7 = calcJacksonPollock({ sites: e.sites, sex: e.sex, age: e.age }, '7')
        const r3 = calcJacksonPollock({ sites: e.sites, sex: e.sex, age: e.age }, '3')
        const pct = r7.bodyFatPct ?? r3.bodyFatPct
        return {
          date: formatDate(e.localDate + 'T12:00:00', lang, { day: 'numeric', month: 'short' }),
          pct,
          keep: range === 0 || new Date(e.localDate + 'T12:00:00').getTime() >= cutoff,
        }
      })
      .filter((d) => d.pct != null && d.keep)
  }, [entries, range, lang])

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        {entries.length === 0 ? t('stats.grasaSinDatos') : t('stats.sinRango')}
      </p>
    )
  }

  const min = Math.min(...data.map((d) => d.pct as number)) - 1
  const max = Math.max(...data.map((d) => d.pct as number)) + 1

  return (
    <div>
      <div className="mb-2 flex gap-2">
        {ranges.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            aria-pressed={range === r.value}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              range === r.value
                ? 'border-cta bg-cta/20 text-accent-soft'
                : 'border-border text-muted hover:border-cta'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <AnimatedAreaChart data={data} height={220} label={t('stats.grasaAria')} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="skinfoldGradient" x1="0" y1="0" x2="0" y2="1">
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
        <YAxis domain={[min, max]} tick={axisTick(colors)} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          contentStyle={tooltipStyle(colors)}
          labelStyle={{ color: colors.muted }}
          itemStyle={{ color: colors.fg }}
          formatter={(value) => [`${value} %`, t('stats.grasaCorporal')]}
        />
        <Area
          type="monotone"
          dataKey="pct"
          stroke={colors.gold}
          strokeWidth={2.5}
          fill="url(#skinfoldGradient)"
          dot={{ r: 4, fill: colors.gold, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: colors.cta, strokeWidth: 0 }}
        />
      </AnimatedAreaChart>
    </div>
  )
}
