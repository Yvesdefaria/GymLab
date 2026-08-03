import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, ChevronRight, Star } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { ExerciseFilterBar } from '@/components/exercises/ExerciseFilterBar'
import { useExerciseFavorites } from '@/hooks/useExerciseFavorites'
import {
  useExerciseCatalog,
  filterExercises,
  EMPTY_FILTERS,
  muscleGroupEmoji,
  categoryLabel,
} from '@/hooks/useExerciseCatalog'
import type { ExerciseCatalogFilters } from '@/hooks/useExerciseCatalog'

export const EjerciciosPage = () => {
  const [filters, setFilters] = useState<ExerciseCatalogFilters>(EMPTY_FILTERS)
  const { exercises } = useExerciseCatalog()
  const { favorites, toggle } = useExerciseFavorites()

  const setFiltersPatch = (patch: Partial<ExerciseCatalogFilters>) =>
    setFilters((f) => ({ ...f, ...patch }))

  const filtered = filterExercises(exercises, filters, favorites)
  const hasActiveFilters = Object.values(filters).some(Boolean)

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
            value={filters.search}
            onChange={(e) => setFiltersPatch({ search: e.target.value })}
            placeholder="Buscar ejercicio..."
            aria-label="Buscar ejercicio"
            className="h-11 w-full rounded-xl border border-border bg-bg-elevated pl-9 pr-3 text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
          />
        </div>

        <ExerciseFilterBar filters={filters} onChange={setFiltersPatch} />

        {hasActiveFilters && (
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="min-h-[40px] text-xs text-accent-soft underline underline-offset-4"
          >
            Limpiar filtros
          </button>
        )}

        <div className="space-y-2">
          {filtered.map((ex) => (
            <Link
              key={ex.id}
              to={`/ejercicios/${ex.slug}`}
              className="flex min-h-[56px] items-center gap-3 rounded-xl border border-gold/40 bg-bg-elevated px-4 py-3 transition-colors hover:border-gold/80"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg text-lg">
                {muscleGroupEmoji[ex.muscleGroup]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-fg">{ex.name}</span>
                <span className="block text-xs capitalize text-muted">
                  {ex.muscleGroup} · {ex.equipment} · {categoryLabel(ex.category)}
                </span>
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  void toggle(ex.id)
                }}
                aria-label={favorites.includes(ex.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                aria-pressed={favorites.includes(ex.id)}
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  favorites.includes(ex.id)
                    ? 'bg-cta/20 text-cta'
                    : 'text-muted hover:text-accent-soft'
                }`}
              >
                <Star className="size-5" fill={favorites.includes(ex.id) ? 'currentColor' : 'none'} />
              </button>
              <ChevronRight className="size-5 shrink-0 text-muted" />
            </Link>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-6 text-center">
              <p className="text-sm text-muted">No hay ejercicios con estos filtros.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
