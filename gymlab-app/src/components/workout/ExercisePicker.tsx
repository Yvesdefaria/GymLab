import { useState } from 'react'
import { Search, Plus, X, Star, Clock } from 'lucide-react'
import { ExerciseFilterBar } from '@/components/exercises/ExerciseFilterBar'
import { useExerciseFavorites, useExerciseRecents } from '@/hooks/useExerciseFavorites'
import {
  useExerciseCatalog,
  filterExercises,
  EMPTY_FILTERS,
  muscleGroupEmoji,
  categoryLabel,
} from '@/hooks/useExerciseCatalog'
import type { Exercise } from '@/domain/types'
import type { ExerciseCatalogFilters } from '@/hooks/useExerciseCatalog'

type ExercisePickerProps = {
  onSelect: (exercise: Exercise) => void
  onClose: () => void
}

export const ExercisePicker = ({ onSelect, onClose }: ExercisePickerProps) => {
  const [filters, setFilters] = useState<ExerciseCatalogFilters>(EMPTY_FILTERS)
  const { exercises } = useExerciseCatalog()
  const { favorites, toggle } = useExerciseFavorites()
  const { recents } = useExerciseRecents()

  const setFiltersPatch = (patch: Partial<ExerciseCatalogFilters>) =>
    setFilters((f) => ({ ...f, ...patch }))

  const filtered = filterExercises(exercises, filters, favorites)
  const onlyFavActive = filters.onlyFavorites
  const noFilters =
    !filters.search &&
    !filters.muscle &&
    !filters.category &&
    !filters.equipment &&
    !filters.onlyWithPhoto &&
    !filters.onlyFavorites

  const recentExercises = noFilters
    ? recents
        .map((id) => exercises.find((ex) => ex.id === id))
        .filter((ex): ex is Exercise => Boolean(ex))
    : []

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-bg">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFiltersPatch({ search: e.target.value })}
            placeholder="Buscar ejercicio..."
            className="h-10 w-full rounded-xl border border-border bg-bg-elevated pl-9 pr-3 text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
            autoFocus
          />
        </div>
        <button
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-xl border border-border bg-bg-elevated text-muted hover:text-fg"
        >
          <X className="size-5" />
        </button>
      </div>

      <button
        onClick={() => setFiltersPatch({ onlyFavorites: !onlyFavActive })}
        aria-pressed={onlyFavActive}
        className={`mx-4 my-2 flex min-h-[40px] items-center justify-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors ${
          onlyFavActive
            ? 'border-cta bg-cta/20 text-accent-soft'
            : 'border-border text-muted hover:border-cta hover:text-accent-soft'
        }`}
      >
        <Star className="size-3.5" fill={onlyFavActive ? 'currentColor' : 'none'} />
        Solo favoritos
      </button>

      <div className="max-h-[38vh] overflow-y-auto border-b border-border px-4 py-2">
        <ExerciseFilterBar filters={filters} onChange={setFiltersPatch} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {recentExercises.length > 0 && (
          <div className="mb-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <Clock className="size-3.5" aria-hidden />
              Recientes
            </p>
            <div className="space-y-2">
              {recentExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => onSelect(ex)}
                  className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-gold/40 bg-bg-elevated px-4 py-3 text-left transition-colors hover:border-gold/80"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg text-lg">
                    {muscleGroupEmoji[ex.muscleGroup]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-fg">{ex.name}</span>
                    <span className="block text-xs capitalize text-muted">
                      {ex.muscleGroup} · {ex.equipment}
                    </span>
                  </span>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg text-accent">
                    <Plus className="size-5" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-gold/40 bg-bg-elevated px-4 py-3 text-left transition-colors hover:border-gold/80"
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
              <span
                role="button"
                tabIndex={0}
                aria-label={favorites.includes(ex.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                aria-pressed={favorites.includes(ex.id)}
                onClick={(e) => {
                  e.stopPropagation()
                  void toggle(ex.id)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    void toggle(ex.id)
                  }
                }}
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  favorites.includes(ex.id) ? 'bg-cta/20 text-cta' : 'text-muted hover:text-accent-soft'
                }`}
              >
                <Star className="size-5" fill={favorites.includes(ex.id) ? 'currentColor' : 'none'} />
              </span>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg text-accent">
                <Plus className="size-5" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
