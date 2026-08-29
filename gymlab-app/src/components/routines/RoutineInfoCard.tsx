// Tarjeta de metadatos del detalle de rutina: badges objetivo/días/nivel, favorito, descripción y duración.
import { useTranslation } from 'react-i18next'
import { Clock, Star } from 'lucide-react'
import { OBJECTIVE_ICONS } from '@/components/routines/routineMeta'
import { localizeLevel, localizeObjective, localizeRoutine } from '@/i18n/catalog'
import type { Routine } from '@/domain/types'
import type { AppLanguage } from '@/domain/onboarding'

interface RoutineInfoCardProps {
  routine: Routine
  etaMin: number
  isFavorite: boolean
  onToggleFavorite: () => void
}

export const RoutineInfoCard = ({ routine, etaMin, isFavorite, onToggleFavorite }: RoutineInfoCardProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const Icon = OBJECTIVE_ICONS[routine.objective]
  const localized = localizeRoutine(routine, lang)

  return (
    <div className="panel-elevated rounded-2xl p-4">
      <div className="flex items-start gap-2">
        <div className="mb-2 flex flex-1 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1 text-xs font-medium uppercase tracking-wide text-accent-soft">
            <Icon className="size-4" />
            {localizeObjective(routine.objective, lang)}
          </span>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
            {routine.daysCount === 1 ? t('rutinas.sesionSuelta') : t('rutinas.diasSemana', { count: routine.daysCount })}
          </span>
          <span className="rounded-full border border-border px-3 py-1 text-xs capitalize text-muted">
            {localizeLevel(routine.level, lang)}
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? t('rutinas.quitarFavoritas') : t('rutinas.anadirFavoritas')}
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
            isFavorite
              ? 'border-cta bg-cta/20 text-cta'
              : 'border-border text-muted hover:border-cta hover:text-accent-soft'
          }`}
        >
          <Star className="size-5" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <p className="text-sm text-fg">{localized.description}</p>
      <p className="mt-3 flex items-center gap-2 text-sm text-muted">
        <Clock className="size-4 text-accent" />
        {t('rutinas.detalle.duracionEstimada', { min: etaMin })}
      </p>
    </div>
  )
}