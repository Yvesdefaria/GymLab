// JournalChart: tendencia de los 4 ratings del journal (energía, sueño, ánimo, dolor) en el tiempo.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import { ChartCard } from '@/components/stats/ChartCard'
import { StatRow, type StatItem } from '@/components/stats/StatRow'
import { useThemeColors } from '@/hooks/useThemeColors'
import { axisTick, tooltipStyle } from '@/components/stats/chartStyle'
import { formatDayShort } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { SessionJournalEntry, Workout } from '@/domain/types'

type Props = {
  journals: SessionJournalEntry[]
  workouts: Workout[]
}

const METRIC_COLORS = {
  energy: '#D9B384',
  sleep: '#7EB8DA',
  mood: '#4ADE80',
  soreness: '#D44040',
} as const

export const JournalChart = ({ journals, workouts }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useThemeColors()

  const workoutDateMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const w of workouts) {
      if (w.id) map.set(w.id, w.localDate)
    }
    return map
  }, [workouts])

  const points = useMemo(() => {
    return journals
      .map((j) => {
        const date = workoutDateMap.get(j.workoutId)
        if (!date) return null
        return {
          label: formatDayShort(date, lang),
          energy: j.energy,
          sleep: j.sleep,
          mood: j.mood,
          soreness: j.soreness,
        }
      })
      .filter((p): p is NonNullable<typeof p> => p != null)
      .slice(-20)
  }, [journals, workoutDateMap, lang])

  const stats = useMemo((): StatItem[] => {
    if (points.length === 0) return []
    const avg = (key: 'energy' | 'sleep' | 'mood' | 'soreness') =>
      points.reduce((s, p) => s + p[key], 0) / points.length
    return [
      { value: Math.round(avg('energy') * 10) / 10, label: t('journal.resumenEnergia'), format: 'decimal' },
      { value: Math.round(avg('sleep') * 10) / 10, label: t('journal.resumenSueno'), format: 'decimal' },
      { value: Math.round(avg('mood') * 10) / 10, label: t('journal.resumenAnimo'), format: 'decimal' },
      { value: Math.round(avg('soreness') * 10) / 10, label: t('journal.resumenDolor'), format: 'decimal' },
    ]
  }, [points, t])

  if (points.length === 0) {
    return (
      <ChartCard title={t('journal.titulo')}>
        <p className="py-4 text-center text-sm text-muted">{t('journal.sinDatos')}</p>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title={t('journal.titulo')}
      subtitle={t('journal.subtitulo')}
      stats={<StatRow stats={stats} />}
    >
      <div role="img" aria-label={t('journal.titulo')}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={points} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={axisTick(colors)} axisLine={false} tickLine={false} minTickGap={12} interval="preserveStartEnd" />
            <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={axisTick(colors)} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={tooltipStyle(colors)} labelStyle={{ color: colors.muted }} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: colors.muted }}
              iconType="circle"
              iconSize={8}
            />
            <Line type="monotone" dataKey="energy" stroke={METRIC_COLORS.energy} strokeWidth={2} dot={false} name={t('journal.resumenEnergia')} />
            <Line type="monotone" dataKey="sleep" stroke={METRIC_COLORS.sleep} strokeWidth={2} dot={false} name={t('journal.resumenSueno')} />
            <Line type="monotone" dataKey="mood" stroke={METRIC_COLORS.mood} strokeWidth={2} dot={false} name={t('journal.resumenAnimo')} />
            <Line type="monotone" dataKey="soreness" stroke={METRIC_COLORS.soreness} strokeWidth={2} dot={false} name={t('journal.resumenDolor')} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
