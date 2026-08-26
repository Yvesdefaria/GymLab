import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Flame, Trophy, Clock, Dumbbell, Sparkles, TrendingUp } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { SessionJournalSheet } from '@/components/journal/SessionJournalSheet'
import { Button, ButtonLink } from '@/components/ui/Button'
import { SwipeRow } from '@/components/ui/SwipeRow'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { applyUnits } from '@/domain/settings'
import type { Units } from '@/domain/settings'

interface StatCardProps {
  icon: typeof Flame
  label: string
  value: string
  highlight?: boolean
}

const StatCard = ({ icon: Icon, label, value, highlight }: StatCardProps) => (
  <div
    className={`panel flex w-max min-w-[190px] items-center gap-3 rounded-2xl p-3 text-left ${
      highlight ? 'border-cta/50 bg-cta/10' : ''
    }`}
  >
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
        highlight ? 'bg-cta/20 text-accent-soft' : 'bg-bg text-muted'
      }`}
    >
      <Icon className="size-5" />
    </span>
    <div className="min-w-0">
      <p className="kicker">{label}</p>
      <p className="stat-value mt-0.5 text-lg leading-tight">{value}</p>
    </div>
  </div>
)

const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2
  const dist = 44 + (i % 3) * 14
  return {
    tx: Math.round(Math.cos(angle) * dist),
    ty: Math.round(Math.sin(angle) * dist),
  }
})

export interface SessionSummaryViewProps {
  workoutId: number
  totalVolume: number
  completedSets: number
  totalSets: number
  durationMin: number
  prCount: number
  exerciseCount: number
  streak: number
  skippedSets: number
  units: string
  unitKey: Units
}

export const SessionSummaryView = ({
  workoutId,
  totalVolume,
  completedSets,
  totalSets,
  durationMin,
  prCount,
  exerciseCount,
  streak,
  skippedSets,
  units,
  unitKey,
}: SessionSummaryViewProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showJournal, setShowJournal] = useState(false)

  const headline =
    prCount > 0
      ? t('session.resumenPr')
      : streak >= 3
        ? t('session.resumenRacha')
        : t('session.resumenBuenEntreno')

  const kicker =
    prCount > 0
      ? t('session.prNuevos' as any, { count: prCount })
      : streak >= 3
        ? t('session.diasSeguidos' as any, { count: streak })
        : t('session.cadaSerieCuenta')

  return (
    <div className="min-h-dvh bg-bg">
      <AppHeader title={t('session.entrenoCompletado')} />
      <div className="flex flex-col items-center gap-6 px-5 pb-28 pt-6 text-center">
        <div className="relative">
          {prCount > 0 &&
            PARTICLES.map((p, i) => (
              <span
                key={i}
                className="burst-particle"
                style={
                  {
                    '--tx': `${p.tx}px`,
                    '--ty': `${p.ty}px`,
                    animationDelay: `${i * 0.03}s`,
                  } as React.CSSProperties
                }
              />
            ))}
          <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-cta/20 blur-2xl" />
          <div className="flex size-20 items-center justify-center rounded-full bg-cta/15 ring-1 ring-cta/40">
            {prCount > 0 ? (
              <Trophy className="size-10 text-cta" strokeWidth={2.2} />
            ) : (
              <Flame className="size-10 text-cta" strokeWidth={2.2} />
            )}
          </div>
          {prCount > 0 && (
            <Sparkles className="absolute -right-2 -top-1 size-6 text-cta" />
          )}
        </div>

        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold tracking-tight text-fg">
            {headline}
          </h2>
          <p className="mx-auto max-w-xs text-sm text-muted">{kicker}</p>
        </div>

        <ProgressRing value={100} label={t('session.sesionCompleta')} />

        <SwipeRow className="flex w-full max-w-sm gap-3">
          <StatCard
            icon={Flame}
            label={t('session.volumen')}
            value={`${Math.round(applyUnits(totalVolume, unitKey)).toLocaleString()} ${units}`}
          />
          <StatCard icon={Dumbbell} label={t('session.series')} value={`${completedSets}/${totalSets}`} />
          <StatCard icon={Clock} label={t('session.duracion')} value={t('session.min' as any, { min: durationMin })} />
          <StatCard
            icon={prCount > 0 ? Trophy : TrendingUp}
            label={prCount > 0 ? t('session.prs') : t('session.racha')}
            value={prCount > 0 ? `+${prCount}` : t('session.streakD' as any, { count: streak })}
            highlight={prCount > 0}
          />
        </SwipeRow>

        <div className="flex w-full max-w-sm flex-col gap-3">
          <Button size="lg" className="w-full" onClick={() => navigate('/')}>
            <Flame className="size-5" />
            {t('session.volverAlInicio')}
          </Button>
          <ButtonLink to="/perfil" variant="outline" className="w-full">
            {t('session.verMiProgreso')}
          </ButtonLink>
        </div>

        <p className="text-xs text-muted">
          {t('session.ejerciciosRegistrados' as any, { count: exerciseCount })}
        </p>
        {skippedSets > 0 && (
          <p role="status" className="max-w-xs text-xs text-danger/80">
            {t('session.seriesVacias' as any, { count: skippedSets })}.
          </p>
        )}
      </div>
      {showJournal && (
        <SessionJournalSheet
          workoutId={workoutId}
          onClose={() => setShowJournal(false)}
        />
      )}
    </div>
  )
}
