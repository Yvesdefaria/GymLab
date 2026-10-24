// Tarjeta editorial de rutina: portada con scrim, título Oswald y una hairline de métricas.
// Sin sombras ni glows (Nocturno Minimal); la foto manda y el texto se apoya en el scrim.
import { memo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Star } from 'lucide-react'
import type { AppLanguage } from '@/domain/onboarding'
import type { Routine } from '@/domain/types'
import { localizeLevel, localizeObjective, localizeRoutine } from '@/i18n/catalog'

// Portada prestada del catálogo para rutinas propias (estable por id y sin repetir).
const coverFor = (routine: Routine, fallbackImages: string[]): string => {
  if (routine.imageUrl) return routine.imageUrl
  if (fallbackImages.length === 0) return '/images/routines/default.jpg'
  return fallbackImages[routine.id % fallbackImages.length]
}

export const RoutineCard = memo(({
  routine,
  badge,
  isActive,
  isFav,
  onToggleFav,
  fallbackImages,
  exerciseCount,
}: {
  routine: Routine
  badge?: string
  isActive?: boolean
  isFav: boolean
  onToggleFav: () => void
  fallbackImages: string[]
  exerciseCount?: number
}) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const localized = localizeRoutine(routine, lang)
  const solo = routine.daysCount === 1
  const kicker = isActive ? t('rutinas.activa') : (badge ?? localizeObjective(routine.objective, lang))
  // Meta en una sola línea: nivel · frecuencia · ejercicios (el conteo se omite si falta).
  const meta = [
    localizeLevel(routine.level, lang),
    solo ? t('rutinas.sesionSuelta') : t('rutinas.diasSemana', { count: routine.daysCount }),
    exerciseCount != null ? t('rutinas.ejercicios', { count: exerciseCount }) : null,
  ].filter(Boolean).join(' · ')

  return (
    <article className={`routine-card relative overflow-hidden rounded-2xl border bg-bg-elevated ${
      isActive ? 'border-cta/50' : 'border-border/55'
    }`}>
      <Link
        to={`/rutinas/${routine.slug}`}
        aria-label={localized.title}
        className="routine-card__link block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <div className="routine-cover relative h-[146px] overflow-hidden">
          <img
            src={coverFor(routine, fallbackImages)}
            alt=""
            loading="lazy"
            decoding="async"
            aria-hidden="true"
            className="size-full object-cover"
          />
          <span className="routine-card__kicker absolute left-3 top-2.5 z-10 max-w-[calc(100%-4.5rem)] truncate text-[8.5px] font-semibold uppercase tracking-[0.17em] text-[#fdddb4] [text-shadow:0_1px_3px_rgba(0,0,0,.95),0_1px_14px_rgba(0,0,0,.85)]">
            {kicker}
          </span>
          <h3 className="routine-card__title absolute inset-x-3 bottom-2.5 z-10 line-clamp-2 min-h-[42px] font-display text-lg font-medium leading-tight tracking-wide text-[#f8fafc] [text-shadow:0_1px_12px_rgba(0,0,0,.65)]">
            {localized.title}
          </h3>
        </div>
        <div className="routine-card__meta flex h-9 items-center gap-1.5 border-t border-border/40 px-3 text-[10px] text-muted">
          <span className="truncate">{meta}</span>
          <ChevronRight className="ml-auto size-4 shrink-0 text-muted" aria-hidden />
        </div>
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
        className={`absolute right-2 top-2 z-20 flex size-11 items-center justify-center rounded-full border backdrop-blur-md transition-colors ${
          isFav
            ? 'border-cta/60 bg-bg/75 text-cta'
            : 'border-border/60 bg-bg/75 text-fg hover:border-cta/50 hover:text-cta'
        }`}
      >
        <Star className="size-4" fill={isFav ? 'currentColor' : 'none'} aria-hidden />
      </button>
    </article>
  )
})
RoutineCard.displayName = 'RoutineCard'


