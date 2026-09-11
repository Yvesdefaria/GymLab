// Página /rutinas: catálogo de rutinas (favoritas, propias y predefinidas) con filtros.
// Permite crear rutinas nuevas y marcar/desmarcar favoritas desde cada tarjeta.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Star, User } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { RoutineCard } from '@/components/routines/RoutineCard'
import { RoutineFilters, type RoutineFiltersValue } from '@/components/routines/RoutineFilters'
import { useRoutines } from '@/hooks/useRoutines'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { useRoutineFavorites } from '@/hooks/useRoutineFavorites'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { OBJECTIVES } from '@/domain/catalog'
import { OBJECTIVE_ICONS, OBJECTIVE_COLORS } from '@/components/routines/routineMeta'
import { localizeObjective, localizeRoutine } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'

export const RutinasPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [filters, setFilters] = useState<RoutineFiltersValue>({ type: 'todas', objective: null, level: null })
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
    const matchObj = !filters.objective || r.objective === filters.objective
    const matchLvl = !filters.level || r.level === filters.level
    const matchType =
      filters.type === 'todas' || (filters.type === 'sesion' && r.daysCount === 1) || (filters.type === 'programa' && r.daysCount > 1)
    return matchObj && matchLvl && matchType && matchesQuery(r)
  }), [routines, filters, q])

  const favRoutines = useMemo(() => routines.filter((r) => favorites.includes(r.id) && matchesQuery(r)), [routines, favorites, q])
  const activeRoutineId = program?.routineId

  // Agrupa las predefinidas por objetivo para mostrarlas en secciones con encabezado.
  const grouped = useMemo(() => OBJECTIVES
    .map((obj) => ({ obj, routines: predefined.filter((r) => r.objective === obj) }))
    .filter((g) => g.routines.length > 0)
  , [predefined])

  const hasFilters = filters.objective !== null || filters.level !== null || filters.type !== 'todas'

  // Badge de rutina propia: "Basada en {título}" si proviene de un clon con origen
  // localizable; degrada a "Propia" cuando falta basedOnId o el origen se perdió.
  // Precalculado en un mapa por id para no hacer un find() por tarjeta en el render.
  const badges = useMemo(() => {
    const byId = new Map(routines.map((r) => [r.id, r]))
    const map: Record<number, string> = {}
    for (const routine of routines) {
      if (!routine.isCustom) continue
      const source = routine.basedOnId != null ? byId.get(routine.basedOnId) : undefined
      map[routine.id] = source
        ? t('rutinas.basadaEn', { titulo: localizeRoutine(source, lang).title })
        : t('rutinas.propia')
    }
    return map
  }, [routines, lang, t])

  // Toggle de favorito estable por rutina: un callback cacheado por id para que el
  // memo de RoutineCard pueda saltarse re-renders cuando solo cambia el filtro.
  const toggleFavByRoutine = useMemo(
    () => new Map(routines.map((r) => [r.id, () => void toggle(r.id)])),
    [routines, toggle],
  )

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
                  onToggleFav={toggleFavByRoutine.get(routine.id) ?? (() => void toggle(routine.id))}
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
                  badge={badges[routine.id]}
                  isActive={routine.id === activeRoutineId}
                  isFav={isFavorite(routine.id)}
                  onToggleFav={toggleFavByRoutine.get(routine.id) ?? (() => void toggle(routine.id))}
                  fallbackImages={catalogImages}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-2 font-display text-base text-accent">{t('rutinas.predefinidas')}</h2>

          <div className="mb-3">
            <RoutineFilters value={filters} onChange={setFilters} lang={lang} />
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
                        onToggleFav={toggleFavByRoutine.get(routine.id) ?? (() => void toggle(routine.id))}
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
