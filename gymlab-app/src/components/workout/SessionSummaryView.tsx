// F132.2 — resumen post-entreno Nocturno: héroe volumen, stat row hairline y UNA
// acción primaria. Conserva journal autoabierto, share, PRs y skipped sets.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Flame, Share2, Trophy } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { SessionJournalSheet } from '@/components/journal/SessionJournalSheet'
import { SessionImageExport } from '@/components/session/SessionImageExport'
import { Button, ButtonLink } from '@/components/ui/Button'
import { useSessionPhotoData } from '@/hooks/useSessionPhotoData'
import { useWorkout } from '@/hooks/useWorkouts'
import { applyUnits } from '@/domain/settings'
import type { Units } from '@/domain/settings'

export interface SessionSummaryViewProps {
  workoutId: number
  totalVolume: number
  bodyweightReps?: number
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
  bodyweightReps = 0,
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
  const [showJournal, setShowJournal] = useState(true)
  const [showShare, setShowShare] = useState(false)
  const { workout, sets } = useWorkout(workoutId)
  const photoData = useSessionPhotoData(workout, sets, prCount)

  const headline =
    prCount > 0
      ? t('session.resumenPr')
      : streak >= 3
        ? t('session.resumenRacha')
        : t('session.resumenBuenEntreno')

  const kicker =
    prCount > 0
      ? t('session.prNuevos' as never, { count: prCount })
      : streak >= 3
        ? t('session.diasSeguidos' as never, { count: streak })
        : t('session.cadaSerieCuenta')

  return (
    <div className="min-h-dvh bg-bg">
      <AppHeader title={t('session.entrenoCompletado')} />
      <div className="flex flex-col items-center gap-4 px-5 pb-28 pt-6 text-center">
        <div
          className={`flex size-14 items-center justify-center rounded-full border ${
            prCount > 0
              ? 'border-success/40 bg-success/10 text-success'
              : 'border-gold/30 bg-gold/10 text-gold'
          }`}
        >
          {prCount > 0 ? (
            <Trophy className="size-6" aria-hidden />
          ) : (
            <Flame className="size-6" aria-hidden />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{kicker}</p>
          <h2 className="font-display text-2xl font-normal tracking-wide text-fg">{headline}</h2>
        </div>

        <div className="w-full border-b border-border/40 pb-5">
          <p className="kicker text-gold">{t('session.volumen')}</p>
          <p className="mt-1 font-display text-5xl font-light tabular-nums tracking-tight text-fg">
            {Math.round(applyUnits(totalVolume, unitKey)).toLocaleString()}{' '}
            <small className="font-sans text-sm font-normal text-muted">{units}</small>
          </p>
          <p className="mt-1 text-[10px] text-muted">
            {t('session.ejerciciosRegistrados' as never, { count: exerciseCount })}
          </p>
          {bodyweightReps > 0 && (
            <p className="mt-0.5 text-[10px] text-muted">
              {t('session.repsPesoCorporal' as never, { count: bodyweightReps })}
            </p>
          )}
        </div>

        <div className="grid w-full grid-cols-3 divide-x divide-border/40 border-b border-border/40 py-3">
          <div className="px-2">
            <p className="kicker">{t('session.series')}</p>
            <p className="mt-0.5 font-display text-xl font-light tabular-nums text-fg">
              {completedSets}/{totalSets}
            </p>
          </div>
          <div className="px-2">
            <p className="kicker">{t('session.duracion')}</p>
            <p className="mt-0.5 font-display text-xl font-light tabular-nums text-fg">
              {t('session.min' as never, { min: durationMin })}
            </p>
          </div>
          <div className="px-2">
            <p className="kicker">{t('session.ejercicios')}</p>
            <p className="mt-0.5 font-display text-xl font-light tabular-nums text-fg">
              {exerciseCount}
            </p>
          </div>
        </div>

        {skippedSets > 0 && (
          <p role="status" className="max-w-xs text-[10px] text-danger/80">
            {t('session.seriesVacias' as never, { count: skippedSets })}.
          </p>
        )}

        {photoData && (
          <div className="w-full border-b border-border/40 pb-2">
            <button
              type="button"
              onClick={() => setShowShare((value) => !value)}
              aria-expanded={showShare}
              className="flex min-h-11 w-full items-center justify-center gap-2 text-sm text-fg"
            >
              <Share2 className="size-4 text-gold" aria-hidden />
              {t('workout.compartirComoImagen')}
            </button>
            {showShare && (
              <div className="pt-2">
                <SessionImageExport data={photoData} />
              </div>
            )}
          </div>
        )}

        <div className="flex w-full max-w-sm flex-col gap-2 pt-1">
          <Button size="lg" className="w-full" onClick={() => navigate('/')}>
            <Flame className="size-5" aria-hidden />
            {t('session.volverAlInicio')}
          </Button>
          <ButtonLink to="/perfil" variant="outline" className="w-full">
            {t('session.verMiProgreso')}
          </ButtonLink>
        </div>
      </div>

      {showJournal && (
        <SessionJournalSheet workoutId={workoutId} onClose={() => setShowJournal(false)} />
      )}
    </div>
  )
}
