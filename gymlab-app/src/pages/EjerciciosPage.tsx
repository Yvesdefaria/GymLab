// Página catálogo «Ejercicios» (/ejercicios): lista virtualizada con búsqueda, filtros y favoritos.
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, ChevronRight, Star } from 'lucide-react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { ExerciseFilterBar } from '@/components/exercises/ExerciseFilterBar'
import { useExerciseFavorites } from '@/hooks/useExerciseFavorites'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  useExerciseCatalog,
  filterExercises,
  EMPTY_FILTERS,
} from '@/hooks/useExerciseCatalog'
import type { ExerciseCatalogFilters } from '@/hooks/useExerciseCatalog'
import { MuscleGroupIcon } from '@/components/exercises/MuscleGroupIcon'
import { localizeExercise, localizeMuscleGroup, localizeEquipment, localizeCategory } from '@/i18n/catalog'
import type { Exercise } from '@/domain/types'
import type { AppLanguage } from '@/domain/onboarding'

const ROW_HEIGHT = 64
const ROW_GAP = 8

// Fila memoizada del catálogo: enlace a la ficha y botón de favorito (evita re-renders).
const ExerciseRow = memo(
  ({
    exercise,
    isFavorite,
    onToggle,
  }: {
    exercise: Exercise
    isFavorite: boolean
    onToggle: (id: number) => void
  }) => {
    const { t, i18n } = useTranslation()
    const lang = i18n.language as AppLanguage
    const ex = localizeExercise(exercise, lang)
    return (
      <div       className="flex h-full w-full items-center gap-3 panel-flush rounded-xl border-b border-border/30 px-4 py-3 transition-colors hover:border-gold/80">
        <Link
          to={`/ejercicios/${exercise.slug}`}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg text-accent">
            <MuscleGroupIcon group={exercise.muscleGroup} className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-fg">{ex.name}</span>
            <span className="block text-xs capitalize text-muted">
              {localizeMuscleGroup(exercise.muscleGroup, lang)} · {localizeEquipment(exercise.equipment, lang)} · {localizeCategory(exercise.category ?? 'strength', lang)}
            </span>
          </span>
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void onToggle(exercise.id)
          }}
          aria-label={isFavorite ? t('ejercicios.quitarFavorito') : t('ejercicios.anadirFavorito')}
          aria-pressed={isFavorite}
          className={`relative flex size-10 shrink-0 items-center justify-center rounded-full after:absolute after:-inset-1 after:content-[''] ${
            isFavorite ? 'bg-cta/20 text-cta' : 'text-muted hover:text-accent-soft'
          }`}
        >
          <Star className="size-5" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
      </div>
    )
  },
)
ExerciseRow.displayName = 'ExerciseRow'

// Catálogo: combina búsqueda (con debounce), filtros y favoritos para obtener la lista visible.
export const EjerciciosPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [filters, setFilters] = useState<ExerciseCatalogFilters>(EMPTY_FILTERS)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 150)
  const { exercises } = useExerciseCatalog()
  const { favorites, toggle } = useExerciseFavorites()

  // Lista con los nombres ya localizados para que la búsqueda coincida en el idioma activo.
  const localizedExercises = useMemo(
    () => exercises.map((ex) => localizeExercise(ex, lang)),
    [exercises, lang],
  )

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
    () => filterExercises(localizedExercises, activeFilters, favoritesSet),
    [localizedExercises, activeFilters, favoritesSet],
  )
  const hasActiveFilters = useMemo(
    () => Object.values(activeFilters).some(Boolean),
    [activeFilters],
  )

  const listRef = useRef<HTMLDivElement | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  // Recalcula la posición de la lista respecto a la ventana para que la virtualización sea precisa.
  useLayoutEffect(() => {
    const el = listRef.current
    if (el) setScrollMargin(el.getBoundingClientRect().top + window.scrollY)
  }, [hasActiveFilters, exercises.length])

  // Virtualización por ventana: solo renderiza las filas visibles (y un pequeño overscan).
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
        title={t('ejercicios.titulo')}
        subtitle={t('ejercicios.subtitulo', { count: filtered.length, total: exercises.length })}
      />
      <div className="space-y-4 p-4">
        <BackLink to="/mas" />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('ejercicios.buscarPlaceholder')}
            aria-label={t('ejercicios.buscarAria')}
            className="h-11 w-full rounded-xl border border-border bg-bg-elevated pl-9 pr-3 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
          />
        </div>

        <ExerciseFilterBar filters={filters} onChange={setFiltersPatch} />

        {hasActiveFilters && (
          <button
            onClick={() => {
              setFilters(EMPTY_FILTERS)
              setSearch('')
            }}
            className="min-h-[44px] text-xs text-accent-soft underline underline-offset-4"
          >
            {t('ejercicios.limpiarFiltros')}
          </button>
        )}

        <div ref={listRef}>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-6 text-center">
              <p className="text-sm text-muted">{t('ejercicios.vacioFiltros')}</p>
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
