// Dashboard de progreso: métricas clave con sparklines, narrativa y animaciones vía anime.js.
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Minus, Flame, Dumbbell, Activity, Zap } from 'lucide-react'
import { useWorkouts } from '@/hooks/useWorkouts'
import { usePRs } from '@/hooks/usePRs'
import { buildProgressNarrative } from '@/domain/progressNarrative'
import type { MetricTrend, TrendDirection } from '@/domain/progressNarrative'
import { Sparkline } from '@/components/ui/Sparkline'
import { formatVolume } from '@/domain/volume'
import { toLocalDateStr, addLocalDays } from '@/domain/dates'
import { staggerSlide, fadeIn } from '@/lib/animations'

// Serie de 30 días: volumen diario para sparkline.
const dailyVolumeSeries = (
  workouts: { localDate: string; totalVolume: number }[]
): number[] => {
  const now = toLocalDateStr()
  const start = addLocalDays(now, -29)
  const byDay = new Map<string, number>()
  for (const w of workouts) {
    if (w.localDate >= start) {
      byDay.set(w.localDate, (byDay.get(w.localDate) ?? 0) + w.totalVolume)
    }
  }
  const series: number[] = []
  for (let i = 0; i < 30; i++) {
    const d = addLocalDays(start, i)
    series.push(byDay.get(d) ?? 0)
  }
  return series
}

// Serie de 30 días: PRs por semana para sparkline de fuerza.
const weeklyPRSeries = (prs: { date: string; estimated1RM: number }[]): number[] => {
  const now = toLocalDateStr()
  const series: number[] = []
  for (let i = 3; i >= 0; i--) {
    const weekStart = addLocalDays(now, -7 * (i + 1))
    const weekEnd = addLocalDays(now, -7 * i)
    const weekPRs = prs.filter((pr) => {
      const d = pr.date.length === 10 ? pr.date : pr.date.slice(0, 10)
      return d >= weekStart && d < weekEnd
    })
    const avg = weekPRs.length > 0
      ? weekPRs.reduce((a, pr) => a + pr.estimated1RM, 0) / weekPRs.length
      : 0
    series.push(Math.round(avg))
  }
  return series
}

// Serie de 30 días: sesiones por semana para sparkline de frecuencia.
const weeklyFreqSeries = (workouts: { localDate: string }[]): number[] => {
  const now = toLocalDateStr()
  const series: number[] = []
  for (let i = 3; i >= 0; i--) {
    const weekStart = addLocalDays(now, -7 * (i + 1))
    const weekEnd = addLocalDays(now, -7 * i)
    const count = workouts.filter((w) => {
      return w.localDate >= weekStart && w.localDate < weekEnd
    }).length
    series.push(count)
  }
  return series
}

const trendIcon = (dir: TrendDirection) => {
  if (dir === 'up') return TrendingUp
  if (dir === 'down') return TrendingDown
  return Minus
}

const trendColor = (dir: TrendDirection): string => {
  if (dir === 'up') return 'text-success'
  if (dir === 'down') return 'text-danger'
  return 'text-muted'
}

type MetricCardProps = {
  icon: typeof Dumbbell
  label: string
  metric: MetricTrend
  sparkData: number[]
  format: (v: number) => string
  index: number
}

const MetricCard = ({ icon: Icon, label, metric, sparkData, format, index }: MetricCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const DirIcon = trendIcon(metric.direction)
  const color = trendColor(metric.direction)

  useEffect(() => {
    if (cardRef.current) {
      staggerSlide(cardRef.current, 'up', { delay: index * 80, duration: 350 })
    }
  }, [index])

  return (
    <div
      ref={cardRef}
      className="panel-light anime-ready flex min-w-[140px] flex-1 flex-col gap-2 rounded-2xl p-3"
    >
      <div className="flex items-center justify-between">
        <Icon className="size-4 text-accent" aria-hidden />
        <DirIcon className={`size-3.5 ${color}`} aria-hidden />
      </div>
      <p className="text-[0.65rem] text-muted">{label}</p>
      <p className="font-display text-lg font-bold tabular-nums text-fg">
        {format(metric.current)}
      </p>
      <div className="flex items-center justify-between">
        <Sparkline data={sparkData} height={24} width={60} />
        <span className={`text-[0.6rem] font-semibold ${color}`}>
          {metric.pctChange > 0 ? '+' : ''}{metric.pctChange}%
        </span>
      </div>
    </div>
  )
}

export const ProgressDashboard = () => {
  const { t } = useTranslation()
  const { workouts } = useWorkouts()
  const { prs } = usePRs()
  const narrativeRef = useRef<HTMLDivElement>(null)

  const narrative = useMemo(
    () => buildProgressNarrative(workouts, prs),
    [workouts, prs]
  )

  const volSeries = useMemo(() => dailyVolumeSeries(workouts), [workouts])
  const forceSeries = useMemo(() => weeklyPRSeries(prs), [prs])
  const freqSeries = useMemo(() => weeklyFreqSeries(workouts), [workouts])

  // Streak series simplificada: 1 si entrenó ese día, 0 si no.
  const streakSeries = useMemo(() => {
    const now = toLocalDateStr()
    const trained = new Set(workouts.map((w) => w.localDate))
    const series: number[] = []
    for (let i = 29; i >= 0; i--) {
      const d = addLocalDays(now, -i)
      series.push(trained.has(d) ? 1 : 0)
    }
    return series
  }, [workouts])

  useEffect(() => {
    if (narrativeRef.current && narrative) {
      fadeIn(narrativeRef.current, { delay: 400, duration: 400 })
    }
  }, [narrative])

  if (!narrative) return null

  const toneBg = {
    positive: 'border-success/40 bg-success/10',
    alert: 'border-danger/40 bg-danger/10',
    neutral: 'border-border/30 bg-bg-elevated/30',
  }[narrative.tone]

  return (
    <div className="flex flex-col gap-3">
      <p className="kicker">{t('progress.title')}</p>

      {/* Métricas con sparklines — animación stagger */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <MetricCard
          icon={Flame}
          label={t('progress.streak')}
          metric={narrative.strength}
          sparkData={streakSeries}
          format={(v) => `${v}d`}
          index={0}
        />
        <MetricCard
          icon={Zap}
          label={t('progress.strength')}
          metric={narrative.strength}
          sparkData={forceSeries}
          format={(v) => `${v}`}
          index={1}
        />
        <MetricCard
          icon={Activity}
          label={t('progress.frequency')}
          metric={narrative.frequency}
          sparkData={freqSeries}
          format={(v) => `${v}/sem`}
          index={2}
        />
        <MetricCard
          icon={Dumbbell}
          label={t('progress.volume')}
          metric={narrative.volume}
          sparkData={volSeries}
          format={(v) => formatVolume(v)}
          index={3}
        />
      </div>

      {/* Narrativa — fade-in diferido */}
      <div ref={narrativeRef} className={`anime-ready rounded-xl border ${toneBg} px-3 py-2`}>
        <p className="text-xs text-fg">{narrative.narrative}</p>
      </div>
    </div>
  )
}
