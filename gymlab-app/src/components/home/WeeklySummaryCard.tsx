// Tarjeta de resumen semanal con KPIs, comparativa y animaciones vía anime.js.
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Minus, Dumbbell, Flame, Trophy, Calendar } from 'lucide-react'
import { formatVolume } from '@/domain/volume'
import { formatDayShort } from '@/lib/intl'
import { staggerFade, fadeIn } from '@/lib/animations'
import type { WeeklySummary } from '@/domain/weeklySummary'
import type { AppLanguage } from '@/domain/onboarding'

type Props = {
  summary: WeeklySummary
  units: string
}

const toneConfig = {
  positive: { border: 'border-success/40', bg: 'bg-success/10', icon: TrendingUp, iconColor: 'text-success' },
  alert: { border: 'border-danger/40', bg: 'bg-danger/10', icon: TrendingDown, iconColor: 'text-danger' },
  neutral: { border: 'border-border/30', bg: 'bg-bg-elevated/30', icon: Minus, iconColor: 'text-muted' },
} as const

export const WeeklySummaryCard = ({ summary, units }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const cfg = toneConfig[summary.tone]
  const TrendIcon = cfg.icon
  const pct = Math.round(Math.abs(summary.volumePct))
  const kpiRef = useRef<HTMLDivElement>(null)
  const trendRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (kpiRef.current) {
      staggerFade(kpiRef.current.children, { staggerDelay: 60, duration: 300 })
    }
  }, [])

  useEffect(() => {
    if (trendRef.current) {
      fadeIn(trendRef.current, { delay: 300, duration: 350 })
    }
  }, [])

  // Texto del trend.
  const trendText =
    summary.tone === 'positive'
      ? t('weekly.trendUp', { pct })
      : summary.tone === 'alert'
        ? t('weekly.trendDown', { pct })
        : t('weekly.trendStable')

  return (
    <div className="panel-light rounded-2xl p-4">
      <p className="kicker mb-3">{t('weekly.title')}</p>

      {/* KPIs — animación stagger */}
      <div ref={kpiRef} className="flex justify-between gap-2">
        <div className="flex flex-1 flex-col items-center gap-1">
          <Dumbbell className="size-4 text-accent" aria-hidden />
          <span className="font-display text-lg font-bold tabular-nums text-fg">{summary.sessions}</span>
          <span className="text-[0.6rem] text-muted">{t('weekly.sessions')}</span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1">
          <Flame className="size-4 text-accent" aria-hidden />
          <span className="font-display text-lg font-bold tabular-nums text-fg">
            {formatVolume(summary.volume)} {units}
          </span>
          <span className="text-[0.6rem] text-muted">{t('weekly.volume')}</span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1">
          <Trophy className="size-4 text-accent" aria-hidden />
          <span className="font-display text-lg font-bold tabular-nums text-fg">{summary.prCount}</span>
          <span className="text-[0.6rem] text-muted">{t('weekly.prs')}</span>
        </div>
        {summary.bestDay && (
          <div className="flex flex-1 flex-col items-center gap-1">
            <Calendar className="size-4 text-accent" aria-hidden />
            <span className="font-display text-sm font-bold text-fg">
              {formatDayShort(summary.bestDay, lang)}
            </span>
            <span className="text-[0.6rem] text-muted">{t('weekly.bestDay')}</span>
          </div>
        )}
      </div>

      {/* Trend vs semana anterior — fade-in diferido */}
      {summary.prevSessions > 0 && (
        <div ref={trendRef} className={`anime-ready mt-3 flex items-center gap-2 rounded-xl border ${cfg.border} ${cfg.bg} px-3 py-2`}>
          <TrendIcon className={`size-4 shrink-0 ${cfg.iconColor}`} aria-hidden />
          <p className="text-xs text-fg">{trendText}</p>
        </div>
      )}
    </div>
  )
}
