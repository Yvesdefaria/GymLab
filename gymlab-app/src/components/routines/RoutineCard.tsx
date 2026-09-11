// Tarjeta de rutina del catálogo: foto de fondo + enlace al detalle + botón de favorito. Badges de estado.
import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Star } from 'lucide-react'
import type { AppLanguage } from '@/domain/onboarding'
import type { Routine } from '@/domain/types'
import { OBJECTIVE_COLORS, OBJECTIVE_ICONS } from '@/components/routines/routineMeta'
import { localizeLevel, localizeObjective, localizeRoutine } from '@/i18n/catalog'

export const RoutineCard = memo(({
  routine,
  badge,
  isActive,
  isFav,
  onToggleFav,
  fallbackImages,
}: {
  routine: Routine
  badge?: string
  isActive?: boolean
  isFav: boolean
  onToggleFav: () => void
  fallbackImages: string[]
}) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const localized = localizeRoutine(routine, lang)
  const Icon = OBJECTIVE_ICONS[routine.objective]
  const iconColor = OBJECTIVE_COLORS[routine.objective]
  const solo = routine.daysCount === 1
  // Las rutinas del catálogo traen foto; las custom usan una foto del catálogo
  // elegida por id (estable entre renders y sin repetir) o la imagen predeterminada.
  const imageUrl =
    routine.imageUrl ??
    (fallbackImages.length > 0
      ? fallbackImages[routine.id % fallbackImages.length]
      : '/images/routines/default.jpg')
  return (
    <div className={`routine-card ${isActive ? 'routine-card--active' : ''}`}>
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        aria-hidden="true"
        className="routine-card__img"
      />
      <Link
        to={`/rutinas/${routine.slug}`}
        className="routine-card__link"
      >
        <span className="routine-card__icon" aria-hidden="true">
          <Icon className={`size-6 ${iconColor}`} />
        </span>
        <span className="routine-card__content">
          <span className="routine-card__row">
            <span className="block truncate font-display text-base font-semibold text-fg">{localized.title}</span>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-wide ${OBJECTIVE_COLORS[routine.objective]}`}>
              {localizeObjective(routine.objective, lang)}
            </span>
            {isActive ? (
              <span className="shrink-0 rounded-full border border-cta bg-cta/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-accent-soft">
                {t('rutinas.activa')}
              </span>
            ) : badge ? (
              <span className="shrink-0 rounded-full border border-cta bg-cta/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-accent-soft">
                {badge}
              </span>
            ) : solo ? (
              <span className="shrink-0 rounded-full border border-success/40 bg-success/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-success">
                {t('rutinas.sesionSuelta')}
              </span>
            ) : null}
          </span>
          <span className="block text-xs text-muted">
            {localizeLevel(routine.level, lang)} · {solo ? t('rutinas.sesionSuelta') : t('rutinas.diasSemana', { count: routine.daysCount })}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted" />
      </Link>
      <button
        type="button"
        onClick={onToggleFav}
        aria-pressed={isFav}
        aria-label={
          isFav
            ? t('rutinas.quitarFavAria', { title: localized.title })
            : t('rutinas.anadirFavAria', { title: localized.title })
        }
        className={`my-auto relative z-10 mr-1.5 flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors after:absolute after:-inset-1 after:content-[''] ${
          isFav
            ? 'border-cta bg-cta/20 text-cta'
            : 'border-border bg-bg/60 text-muted hover:border-cta hover:text-accent-soft'
        }`}
      >
        <Star className="size-5" fill={isFav ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
})
RoutineCard.displayName = 'RoutineCard'
