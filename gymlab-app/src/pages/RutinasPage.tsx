// Página /rutinas: catálogo de rutinas (favoritas, propias y predefinidas) con filtros.
// Permite crear rutinas nuevas y marcar/desmarcar favoritas desde cada tarjeta.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Plus, Search, User, Star } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { ButtonLink } from '@/components/ui/Button'
import { useRoutines } from '@/hooks/useRoutines'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { useRoutineFavorites } from '@/hooks/useRoutineFavorites'
import type { Objective, Level } from '@/domain/types'
import { OBJECTIVE_ICONS, OBJECTIVE_COLORS } from '@/components/routines/routineMeta'
import { OBJECTIVE_LABELS, LEVEL_LABELS } from '@/domain/routines'

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
  const { t } = useTranslation()
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
            <span className="block truncate font-display text-base font-semibold text-fg">{routine.title}</span>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-wide ${OBJECTIVE_COLORS[routine.objective]}`}>
              {OBJECTIVE_LABELS[routine.objective]}
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
            {LEVEL_LABELS[routine.level]} · {solo ? t('rutinas.sesionSuelta') : t('rutinas.diasSemana', { count: routine.daysCount })}
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
            ? t('rutinas.quitarFavAria', { title: routine.title })
            : t('rutinas.anadirFavAria', { title: routine.title })
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
  const { t } = useTranslation()
  const [objectiveFilter, setObjectiveFilter] = useState<Objective | null>(null)
  const [levelFilter, setLevelFilter] = useState<Level | null>(null)
  const [typeFilter, setTypeFilter] = useState<'todas' | 'sesion' | 'programa'>('todas')
  const [query, setQuery] = useState('')

  const { routines } = useRoutines()
  const { program } = useActiveProgram()
  const { favorites, isFavorite, toggle } = useRoutineFavorites()

  // Búsqueda textual: coincide con el título en cualquier sección (favoritas, propias, predefinidas).
  const q = query.trim().toLowerCase()
  const matchesQuery = (r: (typeof routines)[number]) => !q || r.title.toLowerCase().includes(q)

  const custom = routines.filter((r) => r.isCustom && matchesQuery(r))
  // Pool de fotos del catálogo para ilustrar rutinas custom (las predefinidas usan la suya).
  const catalogImages = routines.flatMap((r) => (r.imageUrl ? [r.imageUrl] : []))
  // Las predefinidas se filtran por objetivo, nivel y tipo (sesión suelta o programa).
  const predefined = routines.filter((r) => !r.isCustom).filter((r) => {
    const matchObj = !objectiveFilter || r.objective === objectiveFilter
    const matchLvl = !levelFilter || r.level === levelFilter
    const matchType =
      typeFilter === 'todas' || (typeFilter === 'sesion' && r.daysCount === 1) || (typeFilter === 'programa' && r.daysCount > 1)
    return matchObj && matchLvl && matchType && matchesQuery(r)
  })

  const favRoutines = routines.filter((r) => favorites.includes(r.id) && matchesQuery(r))
  const activeRoutineId = program?.routineId

  // Agrupa las predefinidas por objetivo para mostrarlas en secciones con encabezado.
  const grouped = (['volumen', 'definicion', 'fuerza', 'resistencia', 'general'] as const)
    .map((obj) => ({ obj, routines: predefined.filter((r) => r.objective === obj) }))
    .filter((g) => g.routines.length > 0)

  const hasFilters = objectiveFilter !== null || levelFilter !== null || typeFilter !== 'todas'

  return (
    <div>
      <AppHeader title={t('rutinas.titulo')} subtitle={t('rutinas.subtitulo', { count: routines.length })} />
      <div className="space-y-4 p-4 pb-8">
        <ButtonLink
          to="/rutinas/nueva"
          className="w-full"
        >
          <Plus className="size-5" /> {t('rutinas.nueva')}
        </ButtonLink>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
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
            <div className="flex gap-2">
              {([
                { key: 'todas', labelKey: 'rutinas.filtros.tipoTodas' },
                { key: 'sesion', labelKey: 'rutinas.sesionSuelta' },
                { key: 'programa', labelKey: 'rutinas.filtros.tipoPrograma' },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTypeFilter(typeFilter === opt.key ? 'todas' : opt.key)}
                  className={`inline-flex min-h-[44px] items-center rounded-full px-3 text-xs font-medium transition-colors ${
                    typeFilter === opt.key
                      ? 'border border-cta bg-cta/20 text-accent-soft'
                      : 'border border-border text-muted hover:border-cta hover:text-accent-soft'
                  }`}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <p className="mb-2 kicker">{t('rutinas.filtros.objetivo')}</p>
            <div className="flex flex-wrap gap-2">
              {(['volumen', 'definicion', 'fuerza', 'resistencia', 'general'] as const).map((obj) => (
                <button
                  key={obj}
                  onClick={() => setObjectiveFilter(objectiveFilter === obj ? null : obj)}
                  className={`inline-flex min-h-[44px] items-center rounded-full px-3 text-xs font-medium capitalize transition-colors ${
                    objectiveFilter === obj
                      ? 'border border-cta bg-cta/20 text-accent-soft'
                      : 'border border-border text-muted hover:border-cta hover:text-accent-soft'
                  }`}
                >
                  {OBJECTIVE_LABELS[obj]}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <p className="mb-2 kicker">{t('rutinas.filtros.nivel')}</p>
            <div className="flex gap-2">
              {(['principiante', 'intermedio', 'avanzado'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(levelFilter === lvl ? null : lvl)}
                  className={`inline-flex min-h-[44px] items-center rounded-full px-3 text-xs font-medium capitalize transition-colors ${
                    levelFilter === lvl
                      ? 'border border-cta bg-cta/20 text-accent-soft'
                      : 'border border-border text-muted hover:border-cta hover:text-accent-soft'
                  }`}
                >
                  {LEVEL_LABELS[lvl]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {grouped.map(({ obj, routines }) => {
              const GroupIcon = OBJECTIVE_ICONS[obj]
              return (
                <div key={obj}>
                  <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-accent-soft">
                    <GroupIcon className={`size-4 ${OBJECTIVE_COLORS[obj]}`} />
                  {OBJECTIVE_LABELS[obj]}
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
              <div className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-6 text-center">
                {hasFilters || q ? (
                  <p className="text-sm text-muted">
                    {q
                      ? t('rutinas.vacioBusqueda', { query: query.trim() })
                      : t('rutinas.vacioFiltros')}
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-fg">{t('rutinas.vacioSinRutinas')}</p>
                    <p className="mt-1 text-xs text-muted">
                      {t('rutinas.vacioSugerencia')}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
