// Página /rutinas: catálogo editorial con búsqueda, chips de objetivo, grupos colapsables
// y sheets de creación/filtros. Con filtros activos entra en modo resultados.
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { RoutineCard } from '@/components/routines/RoutineCard'
import { RoutineObjectiveChips } from '@/components/routines/RoutineObjectiveChips'
import { RoutineObjectiveGroup } from '@/components/routines/RoutineObjectiveGroup'
import { RoutineSection } from '@/components/routines/RoutineSection'
import { NewRoutineSheet } from '@/components/routines/NewRoutineSheet'
import {
  RoutineFiltersSheet,
  type RoutineFiltersValue,
  type RoutineTypeFilter,
} from '@/components/routines/RoutineFiltersSheet'
import { useRoutines } from '@/hooks/useRoutines'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { useRoutineFavorites } from '@/hooks/useRoutineFavorites'
import { useRoutineExerciseCounts } from '@/hooks/useRoutineExerciseCounts'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { OBJECTIVES } from '@/domain/catalog'
import { programWeekNumber, routineMatchesFilters } from '@/domain/routines'
import { toLocalDateStr } from '@/domain/dates'
import { localizeObjective, localizeRoutine } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'
import type { Level, Objective } from '@/domain/types'

const EMPTY_OBJECTIVE_COUNTS: Record<Objective, number> = {
  fuerza: 0,
  volumen: 0,
  definicion: 0,
  resistencia: 0,
  general: 0,
}

export const RutinasPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [objective, setObjective] = useState<Objective | null>(null)
  const [type, setType] = useState<RoutineTypeFilter>('todas')
  const [level, setLevel] = useState<Level | null>(null)
  const [query, setQuery] = useState('')
  const [openGroup, setOpenGroup] = useState<Objective | null>(null)
  const [autoOpened, setAutoOpened] = useState(false)
  const [sheet, setSheet] = useState<'create' | 'filters' | null>(null)
  const debouncedQuery = useDebouncedValue(query, 200)

  const { routines } = useRoutines()
  const { program } = useActiveProgram()
  const { favorites, isFavorite, toggle, loaded: favoritesLoaded } = useRoutineFavorites()
  const { counts } = useRoutineExerciseCounts()

  const filters: RoutineFiltersValue = { type, objective, level }
  const isFiltering = objective !== null || type !== 'todas' || level !== null || debouncedQuery.trim() !== ''

  const predefined = useMemo(() => routines.filter((r) => !r.isCustom), [routines])
  // Pool de portadas del catálogo: las rutinas propias toman una prestada por id.
  const catalogImages = useMemo(() => routines.flatMap((r) => (r.imageUrl ? [r.imageUrl] : [])), [routines])
  const matching = (value: RoutineFiltersValue) =>
    routines.filter((routine) =>
      routineMatchesFilters(routine, localizeRoutine(routine, lang).title, value, debouncedQuery),
    )
  const results = useMemo(
    () => matching(filters),
    // `filters` se desarma en deps primitivas: el objeto se recrea en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routines, objective, type, level, debouncedQuery, lang],
  )

  const objectiveCounts = useMemo(() => {
    const base = { ...EMPTY_OBJECTIVE_COUNTS }
    // Los chips cuentan todo el catálogo (predefinidas + propias): el modo resultados
    // también las incluye, así el número del chip coincide con lo que se ve al tocarlo.
    for (const routine of routines) base[routine.objective] += 1
    return base
  }, [routines])

  const favoritesList = useMemo(() => routines.filter((r) => favorites.includes(r.id)), [routines, favorites])
  const custom = useMemo(() => routines.filter((r) => r.isCustom), [routines])
  const activeRoutine = useMemo(
    () => (program ? routines.find((r) => r.id === program.routineId) : undefined),
    [routines, program],
  )
  const activeWeek = program ? programWeekNumber(program.startDate, toLocalDateStr()) : null

  // Arranque en frío (sin programa, favoritas ni propias): abrir el primer grupo una vez
  // para que la primera pantalla muestre portadas en vez de cinco filas colapsadas.
  // `favoritesLoaded` evita decidir con la lista de favoritas a medio cargar.
  useEffect(() => {
    if (autoOpened || !favoritesLoaded || predefined.length === 0) return
    if (activeRoutine || favoritesList.length > 0 || custom.length > 0) return
    setOpenGroup(predefined[0].objective)
    setAutoOpened(true)
  }, [autoOpened, favoritesLoaded, predefined, activeRoutine, favoritesList.length, custom.length])

  // Badge de rutina propia: "Basada en {título}" o "Propia" (precalculado por id).
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

  // Callback estable por id: el memo de RoutineCard se salta re-renders al filtrar.
  const toggleFavByRoutine = useMemo(
    () => new Map(routines.map((r) => [r.id, () => void toggle(r.id)])),
    [routines, toggle],
  )

  const renderCard = (routine: (typeof routines)[number]) => (
    <RoutineCard
      key={routine.id}
      routine={routine}
      badge={routine.isCustom ? badges[routine.id] : undefined}
      isActive={routine.id === program?.routineId}
      isFav={isFavorite(routine.id)}
      onToggleFav={toggleFavByRoutine.get(routine.id) ?? (() => void toggle(routine.id))}
      fallbackImages={catalogImages}
      exerciseCount={counts[routine.id]}
    />
  )

  const changeObjective = (value: Objective | null) => {
    setObjective(value)
    setOpenGroup(null)
  }
  const applyFilters = (value: RoutineFiltersValue) => {
    setType(value.type)
    setLevel(value.level)
    setOpenGroup(null)
    setSheet(null)
  }
  const hasFineFilters = type !== 'todas' || level !== null

  return (
    <div>
      <AppHeader
        kicker={t('rutinas.subtitulo', { count: routines.length })}
        title={t('rutinas.titulo')}
        actions={
          <button
            type="button"
            data-tour="rutinas-actions"
            onClick={() => setSheet('create')}
            aria-label={t('rutinas.nueva')}
            className="flex size-11 items-center justify-center rounded-full border border-border/60 text-cta transition-colors hover:border-cta"
          >
            <Plus className="size-5" aria-hidden />
          </button>
        }
      />

      <div className="space-y-5 px-4 pb-8 pt-3">
        <div className="space-y-1" data-tour="rutinas-filters">
          <div className="flex h-11 items-center gap-2 border-b border-border/40">
            <Search className="size-4 text-muted" aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('rutinas.buscarPlaceholder')}
              aria-label={t('rutinas.buscarAria')}
              className="h-full flex-1 bg-transparent text-sm text-fg placeholder:text-muted focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setSheet('filters')}
              aria-label={t('rutinas.filtros.titulo')}
              className="relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/40 text-muted transition-colors hover:border-cta hover:text-accent-soft"
            >
              <SlidersHorizontal className="size-4" aria-hidden />
              {hasFineFilters ? (
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-cta" aria-hidden />
              ) : null}
            </button>
          </div>
          <RoutineObjectiveChips
            objective={objective}
            counts={objectiveCounts}
            total={routines.length}
            onChange={changeObjective}
            lang={lang}
          />
        </div>

        {isFiltering ? (
          <RoutineSection title={t('rutinas.resultados', { count: results.length })}>
            {results.length === 0 ? (
              <EmptyState
                size="md"
                message={
                  debouncedQuery.trim()
                    ? t('rutinas.vacioBusqueda', { query: query.trim() })
                    : t('rutinas.vacioFiltros')
                }
              />
            ) : (
              <div className="space-y-3 pt-2">{results.map((routine) => renderCard(routine))}</div>
            )}
          </RoutineSection>
        ) : (
          <>
            {activeRoutine ? (
              <RoutineSection
                title={t('rutinas.enCurso')}
                meta={activeWeek ? t('rutinas.semana', { n: activeWeek }) : undefined}
              >
                <div className="pt-2">{renderCard(activeRoutine)}</div>
              </RoutineSection>
            ) : null}

            {favoritesList.length > 0 ? (
              <RoutineSection title={t('rutinas.favoritas')} meta={favoritesList.length}>
                <div className="space-y-3 pt-2">
                  {favoritesList.map((routine) => renderCard(routine))}
                </div>
              </RoutineSection>
            ) : null}

            {custom.length > 0 ? (
              <RoutineSection title={t('rutinas.misRutinas')} meta={custom.length}>
                <div className="space-y-3 pt-2">{custom.map((routine) => renderCard(routine))}</div>
              </RoutineSection>
            ) : null}

            {predefined.length === 0 ? (
              <EmptyState
                size="md"
                title={t('rutinas.vacioSinRutinas')}
                message={t('rutinas.vacioSugerencia')}
              />
            ) : (
              <RoutineSection title={t('rutinas.predefinidas')} meta={predefined.length}>
                <div className="pt-1">
                  {OBJECTIVES.map((obj) => {
                    const group = predefined.filter((r) => r.objective === obj)
                    if (group.length === 0) return null
                    return (
                      <RoutineObjectiveGroup
                        key={obj}
                        label={localizeObjective(obj, lang)}
                        count={group.length}
                        open={openGroup === obj}
                        onToggle={() => setOpenGroup((prev) => (prev === obj ? null : obj))}
                      >
                        {group.map((routine) => renderCard(routine))}
                      </RoutineObjectiveGroup>
                    )
                  })}
                </div>
              </RoutineSection>
            )}
          </>
        )}
      </div>

      {sheet === 'create' ? <NewRoutineSheet onClose={() => setSheet(null)} /> : null}
      {sheet === 'filters' ? (
        <RoutineFiltersSheet
          value={filters}
          countFor={(value) => matching(value).length}
          onApply={applyFilters}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </div>
  )
}

