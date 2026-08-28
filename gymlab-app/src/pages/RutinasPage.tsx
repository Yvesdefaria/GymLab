// Página /rutinas: catálogo de rutinas (favoritas, propias y predefinidas) con filtros.
// Permite crear rutinas nuevas y marcar/desmarcar favoritas desde cada tarjeta.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Plus, Search, User, Star } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterChips } from '@/components/ui/FilterChips'
import { useRoutines } from '@/hooks/useRoutines'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { useRoutineFavorites } from '@/hooks/useRoutineFavorites'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { Objective, Level } from '@/domain/types'
import { LEVELS, OBJECTIVES } from '@/domain/catalog'
import { OBJECTIVE_ICONS, OBJECTIVE_COLORS } from '@/components/routines/routineMeta'
import { localizeRoutine, localizeObjective, localizeLevel } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'

// Tarjeta de rutina: foto de fondo + enlace al detalle + botón de favorito. Badges de estado.
const RoutineCard = ({
  routine,
  badge,
  isActive,
  isFav,
  onToggleFav,
  fallbackImages,
}: {
  routine: { id: number; slug: string; title: string; objective: Objective; level: Level; daysCount: number; imageUrl?: string }
  badge?: string
  isActive?: boolean
  isFav: boolean
  onToggleFav: () => void
  fallbackImages: string[]
}) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const localized = localizeRoutine(routine as Parameters<typeof localizeRoutine>[0], lang)
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
}

export const RutinasPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [objectiveFilter, setObjectiveFilter] = useState<Objective | null>(null)
  const [levelFilter, setLevelFilter] = useState<Level | null>(null)
  const [typeFilter, setTypeFilter] = useState<'todas' | 'sesion' | 'programa'>('todas')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 200)

  const { routines } = useRoutines()
  const { program } = useActiveProgram()
  const { favorites, isFavorite, toggle } = useRoutineFavorites()

  // Búsqueda textual con debounce: coincide con el título en cualquier sección.
  const q = debouncedQuery.trim().toLowerCase()
  const matchesQuery = (r: (typeof routines)[number]) => !q || r.title.toLowerCase().includes(q)

  const custom = useMemo(() => routines.filter((r) => r.isCustom && matchesQuery(r)), [routines, q])
  // Pool de fotos del catálogo para ilustrar rutinas custom (las predefinidas usan la suya).
  const catalogImages = useMemo(() => routines.flatMap((r) => (r.imageUrl ? [r.imageUrl] : [])), [routines])
  // Las predefinidas se filtran por objetivo, nivel y tipo (sesión suelta o programa).
  const predefined = useMemo(() => routines.filter((r) => !r.isCustom).filter((r) => {
    const matchObj = !objectiveFilter || r.objective === objectiveFilter
    const matchLvl = !levelFilter || r.level === levelFilter
    const matchType =
      typeFilter === 'todas' || (typeFilter === 'sesion' && r.daysCount === 1) || (typeFilter === 'programa' && r.daysCount > 1)
    return matchObj && matchLvl && matchType && matchesQuery(r)
  }), [routines, objectiveFilter, levelFilter, typeFilter, q])

  const favRoutines = useMemo(() => routines.filter((r) => favorites.includes(r.id) && matchesQuery(r)), [routines, favorites, q])
  const activeRoutineId = program?.routineId

  // Agrupa las predefinidas por objetivo para mostrarlas en secciones con encabezado.
  const grouped = useMemo(() => OBJECTIVES
    .map((obj) => ({ obj, routines: predefined.filter((r) => r.objective === obj) }))
    .filter((g) => g.routines.length > 0)
  , [predefined])

  const hasFilters = objectiveFilter !== null || levelFilter !== null || typeFilter !== 'todas'

  return (
    <div>
      <AppHeader title={t('rutinas.titulo')} subtitle={t('rutinas.subtitulo', { count: routines.length })} />
      <div className="overflow-hidden space-y-4 p-4 pb-8">
        <ButtonLink
          to="/rutinas/nueva"
          className="w-full"
        >
          <Plus className="size-5" /> {t('rutinas.nueva')}
        </ButtonLink>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('rutinas.buscarPlaceholder')}
            aria-label={t('rutinas.buscarAria')}
            className="h-11 w-full rounded-xl border border-border bg-bg-elevated pl-9 pr-3 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
          />
        </div>

        {favRoutines.length > 0 ? (
          <section>
            <h2 className="mb-2 flex items-center gap-2 font-display text-base text-accent">
              <Star className="size-4" /> {t('rutinas.favoritas')}
            </h2>
            <div className="space-y-3">
              {favRoutines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  isActive={routine.id === activeRoutineId}
                  isFav
                  onToggleFav={() => void toggle(routine.id)}
                  fallbackImages={catalogImages}
                />
              ))}
            </div>
          </section>
        ) : null}

        {custom.length > 0 ? (
          <section>
            <h2 className="mb-2 flex items-center gap-2 font-display text-base text-accent">
              <User className="size-4" /> {t('rutinas.misRutinas')}
            </h2>
            <div className="space-y-3">
              {custom.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  badge={t('rutinas.propia')}
                  isActive={routine.id === activeRoutineId}
                  isFav={isFavorite(routine.id)}
                  onToggleFav={() => void toggle(routine.id)}
                  fallbackImages={catalogImages}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-2 font-display text-base text-accent">{t('rutinas.predefinidas')}</h2>

          <div className="mb-3">
            <p className="mb-2 kicker">{t('rutinas.filtros.tipo')}</p>
            <FilterChips<'todas' | 'sesion' | 'programa'>
              options={[
                { value: 'todas', label: t('rutinas.filtros.tipoTodas') },
                { value: 'sesion', label: t('rutinas.sesionSuelta') },
                { value: 'programa', label: t('rutinas.filtros.tipoPrograma') },
              ]}
              value={typeFilter}
              onChange={(v) => setTypeFilter(v ?? 'todas')}
              ariaLabel={t('rutinas.filtros.tipo')}
            />
          </div>

          <div className="mb-3">
            <p className="mb-2 kicker">{t('rutinas.filtros.objetivo')}</p>
            <FilterChips<Objective>
              options={OBJECTIVES.map((obj) => ({ value: obj, label: localizeObjective(obj, lang) }))}
              value={objectiveFilter}
              onChange={setObjectiveFilter}
              ariaLabel={t('rutinas.filtros.objetivo')}
            />
          </div>

          <div className="mb-3">
            <p className="mb-2 kicker">{t('rutinas.filtros.nivel')}</p>
            <FilterChips<Level>
              options={LEVELS.map((lvl) => ({ value: lvl, label: localizeLevel(lvl, lang) }))}
              value={levelFilter}
              onChange={setLevelFilter}
              ariaLabel={t('rutinas.filtros.nivel')}
            />
          </div>

          <div className="space-y-4">
            {grouped.map(({ obj, routines }) => {
              const GroupIcon = OBJECTIVE_ICONS[obj]
              return (
                <div key={obj}>
                  <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-accent-soft">
                    <GroupIcon className={`size-4 ${OBJECTIVE_COLORS[obj]}`} />
                  {localizeObjective(obj, lang)}
                  </h3>
                  <div className="space-y-3">
                    {routines.map((routine) => (
                      <RoutineCard
                        key={routine.id}
                        routine={routine}
                        isActive={routine.id === activeRoutineId}
                        isFav={isFavorite(routine.id)}
                        onToggleFav={() => void toggle(routine.id)}
                        fallbackImages={catalogImages}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
            {grouped.length === 0 && (
              <EmptyState
                title={hasFilters || q ? undefined : t('rutinas.vacioSinRutinas')}
                message={
                  hasFilters || q
                    ? q
                      ? t('rutinas.vacioBusqueda', { query: query.trim() })
                      : t('rutinas.vacioFiltros')
                    : t('rutinas.vacioSugerencia')
                }
                size="md"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
