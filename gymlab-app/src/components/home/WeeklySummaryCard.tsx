// Tarjeta de resumen semanal con KPIs, comparativa y animaciones vía anime.js.
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Minus, Dumbbell, Flame, Trophy, Calendar } from 'lucide-react'
import { formatVolume } from '@/domain/volume'
import { formatDayShort } from '@/lib/intl'
import { prefersReducedMotion } from '@/lib/animations'
import anime from 'animejs'
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
  const [kpiVisible, setKpiVisible] = useState(prefersReducedMotion())
  const [trendVisible, setTrendVisible] = useState(prefersReducedMotion())
  const kpiRef = useRef<HTMLDivElement>(null)
  const trendRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion() || !kpiRef.current) return
    anime({
      targets: kpiRef.current.children,
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 300,
      delay: anime.stagger(60),
      easing: 'easeOutCubic',
      complete: () => setKpiVisible(true),
    })
  }, [])

  useEffect(() => {
    if (prefersReducedMotion() || !trendRef.current || summary.prevSessions === 0) return
    anime({
      targets: trendRef.current,
      opacity: [0, 1],
      translateY: [6, 0],
      duration: 350,
      delay: 300,
      easing: 'easeOutCubic',
      complete: () => setTrendVisible(true),
    })
  }, [summary.prevSessions])

  const trendText =
    summary.tone === 'positive'
      ? t('weekly.trendUp', { pct })
      : summary.tone === 'alert'
        ? t('weekly.trendDown', { pct })
        : t('weekly.trendStable')

  return (
    <div className="panel-light rounded-2xl p-4">
      <p className="kicker mb-3">{t('weekly.title')}</p>

      <div ref={kpiRef} className="flex justify-between gap-2">
        <div style={{ opacity: kpiVisible ? 1 : 0 }} className="flex flex-1 flex-col items-center gap-1">
          <Dumbbell className="size-4 text-accent" aria-hidden />
          <span className="font-display text-lg font-bold tabular-nums text-fg">{summary.sessions}</span>
          <span className="text-[0.6rem] text-muted">{t('weekly.sessions')}</span>
        </div>
        <div style={{ opacity: kpiVisible ? 1 : 0 }} className="flex flex-1 flex-col items-center gap-1">
          <Flame className="size-4 text-accent" aria-hidden />
          <span className="font-display text-lg font-bold tabular-nums text-fg">
            {formatVolume(summary.volume)} {units}
          </span>
          <span className="text-[0.6rem] text-muted">{t('weekly.volume')}</span>
        </div>
        <div style={{ opacity: kpiVisible ? 1 : 0 }} className="flex flex-1 flex-col items-center gap-1">
          <Trophy className="size-4 text-accent" aria-hidden />
          <span className="font-display text-lg font-bold tabular-nums text-fg">{summary.prCount}</span>
          <span className="text-[0.6rem] text-muted">{t('weekly.prs')}</span>
        </div>
        {summary.bestDay && (
          <div style={{ opacity: kpiVisible ? 1 : 0 }} className="flex flex-1 flex-col items-center gap-1">
            <Calendar className="size-4 text-accent" aria-hidden />
            <span className="font-display text-sm font-bold text-fg">
              {formatDayShort(summary.bestDay, lang)}
            </span>
            <span className="text-[0.6rem] text-muted">{t('weekly.bestDay')}</span>
          </div>
        )}
      </div>

      {summary.prevSessions > 0 && (
        <div
          ref={trendRef}
          style={{ opacity: trendVisible ? 1 : 0 }}
          className={`mt-3 flex items-center gap-2 rounded-xl border ${cfg.border} ${cfg.bg} px-3 py-2`}
        >
          <TrendIcon className={`size-4 shrink-0 ${cfg.iconColor}`} aria-hidden />
          <p className="text-xs text-fg">{trendText}</p>
        </div>
      )}
    </div>
  )
}
