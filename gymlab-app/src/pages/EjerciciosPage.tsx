import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, ChevronRight, Star } from 'lucide-react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { AppHeader } from '@/components/layout/AppHeader'
import { ExerciseFilterBar } from '@/components/exercises/ExerciseFilterBar'
import { useExerciseFavorites } from '@/hooks/useExerciseFavorites'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  useExerciseCatalog,
  filterExercises,
  EMPTY_FILTERS,
  muscleGroupEmoji,
  categoryLabel,
} from '@/hooks/useExerciseCatalog'
import type { ExerciseCatalogFilters } from '@/hooks/useExerciseCatalog'
import type { Exercise } from '@/domain/types'

const ROW_HEIGHT = 64
const ROW_GAP = 8

const ExerciseRow = memo(
  ({
    exercise,
    isFavorite,
    onToggle,
  }: {
    exercise: Exercise
    isFavorite: boolean
    onToggle: (id: number) => void
  }) => (
    <Link
      to={`/ejercicios/${exercise.slug}`}
      className="flex h-full w-full items-center gap-3 rounded-xl border border-gold/40 bg-bg-elevated px-4 py-3 transition-colors hover:border-gold/80"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg text-lg">
        {muscleGroupEmoji[exercise.muscleGroup]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-fg">{exercise.name}</span>
        <span className="block text-xs capitalize text-muted">
          {exercise.muscleGroup} · {exercise.equipment} · {categoryLabel(exercise.category)}
        </span>
      </span>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void onToggle(exercise.id)
        }}
        aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        aria-pressed={isFavorite}
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
          isFavorite ? 'bg-cta/20 text-cta' : 'text-muted hover:text-accent-soft'
        }`}
      >
        <Star className="size-5" fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      <ChevronRight className="size-5 shrink-0 text-muted" />
    </Link>
  ),
)
ExerciseRow.displayName = 'ExerciseRow'

export const EjerciciosPage = () => {
  const [filters, setFilters] = useState<ExerciseCatalogFilters>(EMPTY_FILTERS)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 150)
  const { exercises } = useExerciseCatalog()
  const { favorites, toggle } = useExerciseFavorites()

  const setFiltersPatch = useCallback(
    (patch: Partial<ExerciseCatalogFilters>) =>
      setFilters((f) => ({ ...f, ...patch })),
    [],
  )

  const handleToggle = useCallback((id: number) => void toggle(id), [toggle])

  const favoritesSet = useMemo(() => new Set(favorites), [favorites])
  const activeFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  )
  const filtered = useMemo(
    () => filterExercises(exercises, activeFilters, favoritesSet),
    [exercises, activeFilters, favoritesSet],
  )
  const hasActiveFilters = useMemo(
    () => Object.values(activeFilters).some(Boolean),
    [activeFilters],
  )

  const listRef = useRef<HTMLDivElement | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  useLayoutEffect(() => {
    const el = listRef.current
    if (el) setScrollMargin(el.getBoundingClientRect().top + window.scrollY)
  }, [hasActiveFilters, exercises.length])

  const virtualizer = useWindowVirtualizer({
    count: filtered.length,
    estimateSize: () => ROW_HEIGHT,
    gap: ROW_GAP,
    overscan: 6,
    scrollMargin,
    getItemKey: (index) => filtered[index].id,
  })

  return (
    <div>
      <AppHeader
        title="Ejercicios"
        subtitle={`${filtered.length} de ${exercises.length} ejercicios`}
      />
      <div className="space-y-4 p-4">
        <Link
          to="/mas"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Link>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ejercicio..."
            aria-label="Buscar ejercicio"
            className="h-11 w-full rounded-xl border border-border bg-bg-elevated pl-9 pr-3 text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
          />
        </div>

        <ExerciseFilterBar filters={filters} onChange={setFiltersPatch} />

        {hasActiveFilters && (
          <button
            onClick={() => {
              setFilters(EMPTY_FILTERS)
              setSearch('')
            }}
            className="min-h-[40px] text-xs text-accent-soft underline underline-offset-4"
          >
            Limpiar filtros
          </button>
        )}

        <div ref={listRef}>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-6 text-center">
              <p className="text-sm text-muted">No hay ejercicios con estos filtros.</p>
            </div>
          ) : (
            <div style={{ height: virtualizer.getTotalSize() }} className="relative">
              {virtualizer.getVirtualItems().map((item) => {
                const ex = filtered[item.index]
                if (!ex) return null
                return (
                  <div
                    key={item.key}
                    style={{
                      height: ROW_HEIGHT,
                      transform: `translateY(${item.start - scrollMargin}px)`,
                    }}
                    className="absolute left-0 top-0 w-full"
                  >
                    <ExerciseRow
                      exercise={ex}
                      isFavorite={favoritesSet.has(ex.id)}
                      onToggle={handleToggle}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
