// Portada editorial del detalle: la tarjeta del catálogo se abre con la misma foto,
// el mismo scrim y el kicker objetivo · nivel. Sin sombras ni glows.
import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { routineCover } from './routineMeta'
import { localizeLevel, localizeObjective, localizeRoutine } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'
import type { Routine } from '@/domain/types'

interface RoutineHeroProps {
  routine: Routine
  fallbackImages: string[]
  isFavorite: boolean
  onToggleFavorite: () => void
}

export const RoutineHero = ({ routine, fallbackImages, isFavorite, onToggleFavorite }: RoutineHeroProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const localized = localizeRoutine(routine, lang)

  return (
    <section data-testid="routine-hero" className="overflow-hidden rounded-2xl border border-border/55 bg-bg-elevated">
      <div className="routine-cover relative h-[150px] overflow-hidden">
        <img
          src={routineCover(routine, fallbackImages)}
          alt=""
          aria-hidden="true"
          decoding="async"
          className="size-full object-cover"
        />
        <p className="absolute left-3 top-2.5 z-10 max-w-[calc(100%-4.5rem)] truncate text-[8.5px] font-semibold uppercase tracking-[0.17em] text-[#fdddb4] [text-shadow:0_1px_3px_rgba(0,0,0,.95)]">
          {localizeObjective(routine.objective, lang)} · {localizeLevel(routine.level, lang)}
        </p>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? t('rutinas.quitarFavoritas') : t('rutinas.anadirFavoritas')}
          className={`absolute right-2 top-2 z-20 flex size-11 items-center justify-center rounded-full border backdrop-blur-md transition-colors ${
            isFavorite
              ? 'border-cta/60 bg-bg/75 text-cta'
              : 'border-border/60 bg-bg/75 text-fg hover:border-cta/50 hover:text-cta'
          }`}
        >
          <Star className="size-4" fill={isFavorite ? 'currentColor' : 'none'} aria-hidden />
        </button>
      </div>
      <p className="px-4 py-3 text-[13px] leading-relaxed text-muted">{localized.description}</p>
    </section>
  )
}
