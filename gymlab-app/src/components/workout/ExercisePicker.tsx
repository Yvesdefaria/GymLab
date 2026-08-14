// Selector a pantalla completa para añadir ejercicios a la sesión: búsqueda, filtros, favoritos,
// recientes y lista virtualizada.
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, X, Star, Clock } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ExerciseFilterBar } from '@/components/exercises/ExerciseFilterBar'
import { useExerciseFavorites, useExerciseRecents } from '@/hooks/useExerciseFavorites'
import {
  useExerciseCatalog,
  filterExercises,
  EMPTY_FILTERS,
} from '@/hooks/useExerciseCatalog'
import { MuscleGroupIcon } from '@/components/exercises/MuscleGroupIcon'
import type { Exercise } from '@/domain/types'
import type { ExerciseCatalogFilters } from '@/hooks/useExerciseCatalog'
import type { AppLanguage } from '@/domain/onboarding'
import { localizeExercise, localizeMuscleGroup, localizeEquipment, localizeCategory } from '@/i18n/catalog'

const ROW_HEIGHT = 64

type ExercisePickerProps = {
  onSelect: (exercise: Exercise) => void
  onClose: () => void
}

// Fila individual del listado (memoizada): selección, favorito y botón de añadir.
const PickerRow = memo(
  ({
    exercise,
    isFavorite,
    onSelect,
    onToggleFavorite,
  }: {
    exercise: Exercise
    isFavorite: boolean
    onSelect: (exercise: Exercise) => void
    onToggleFavorite: (id: number) => void
  }) => {
    const { t, i18n } = useTranslation()
    const lang = i18n.language as AppLanguage
    const localized = localizeExercise(exercise, lang)
    return (
    <div className="flex h-full w-full min-h-[56px] items-center gap-3 panel rounded-xl px-4 py-3 transition-colors hover:border-gold/80">
      <button
        onClick={() => onSelect(exercise)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg text-accent">
          <MuscleGroupIcon group={exercise.muscleGroup} className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-fg">{localized.name}</span>
          <span className="block text-xs capitalize text-muted">
            {localizeMuscleGroup(exercise.muscleGroup, lang)} · {localizeEquipment(exercise.equipment, lang)} · {localizeCategory(exercise.category ?? 'strength', lang)}
          </span>
        </span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          void onToggleFavorite(exercise.id)
        }}
        aria-label={isFavorite ? t('workout.quitarFavoritos') : t('workout.anadirFavoritos')}
        aria-pressed={isFavorite}
        className={`relative flex size-10 shrink-0 items-center justify-center rounded-full after:absolute after:-inset-1 after:content-[''] ${
          isFavorite ? 'bg-cta/20 text-cta' : 'text-muted hover:text-accent-soft'
        }`}
      >
        <Star className="size-5" fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg text-accent">
        <Plus className="size-5" />
      </span>
    </div>
    )
  },
)
PickerRow.displayName = 'PickerRow'

export const ExercisePicker = ({ onSelect, onClose }: ExercisePickerProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [filters, setFilters] = useState<ExerciseCatalogFilters>(EMPTY_FILTERS)
  const { exercises, loading } = useExerciseCatalog()
  const { favorites, toggle } = useExerciseFavorites()
  const { recents } = useExerciseRecents()

  // Cierra con Escape y devuelve el foco al elemento que abrió el selector al cerrar.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  const setFiltersPatch = useCallback(
    (patch: Partial<ExerciseCatalogFilters>) => setFilters((f) => ({ ...f, ...patch })),
    [],
  )

  const handleSelect = useCallback((ex: Exercise) => onSelect(ex), [onSelect])
  const handleToggleFavorite = useCallback((id: number) => void toggle(id), [toggle])

  const favoritesSet = useMemo(() => new Set(favorites), [favorites])
  // Lista con nombres localizados para que la búsqueda coincida en el idioma activo.
  const localizedExercises = useMemo(
    () => exercises.map((ex) => localizeExercise(ex, lang)),
    [exercises, lang],
  )
  const filtered = useMemo(
    () => filterExercises(localizedExercises, filters, favoritesSet),
    [localizedExercises, filters, favoritesSet],
  )
  const onlyFavActive = filters.onlyFavorites
  // Sin filtros activos se muestran los recientes; con filtros, solo el listado filtrado.
  const noFilters = useMemo(
    () =>
      !filters.search &&
      !filters.muscle &&
      !filters.category &&
      !filters.equipment &&
      !filters.onlyWithPhoto &&
      !filters.onlyFavorites,
    [filters],
  )
  const recentExercises = useMemo(
    () =>
      noFilters
        ? recents
            .map((id) => exercises.find((ex) => ex.id === id))
            .filter((ex): ex is Exercise => Boolean(ex))
        : [],
    [noFilters, recents, exercises],
  )

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const listTopRef = useRef<HTMLDivElement | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  // Calcula el margen de scroll cuando cambian los bloques superiores (recientes/filtros) para
  // que el virtualizador no desalinee las filas absolutas respecto al contenido real.
  useLayoutEffect(() => {
    const list = listTopRef.current
    const scrollEl = scrollRef.current
    if (list && scrollEl) {
      setScrollMargin(
        list.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop,
      )
    }
  }, [recentExercises.length, noFilters, filtered.length])

  // Lista virtualizada: solo monta las filas visibles más overscan, clave para catálogos grandes.
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    gap: 8,
    overscan: 6,
    scrollMargin,
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('workout.elegirEjercicio')}
      className="fixed inset-0 z-[100] flex flex-col bg-bg"
    >
      <div className="flex items-center gap-2 border-b border-border p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFiltersPatch({ search: e.target.value })}
            placeholder={t('workout.buscarEjercicioPlaceholder')}
            aria-label={t('workout.buscarEjercicio')}
            className="h-10 w-full rounded-xl border border-border bg-bg-elevated pl-9 pr-3 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
            autoFocus
          />
        </div>
        <button
          onClick={onClose}
          aria-label={t('workout.cerrarSelector')}
          className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-bg-elevated text-muted after:absolute after:-inset-1 after:content-[''] hover:text-fg"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <button
        onClick={() => setFiltersPatch({ onlyFavorites: !onlyFavActive })}
        aria-pressed={onlyFavActive}
        className={`mx-4 my-2 flex min-h-[44px] items-center justify-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors ${
          onlyFavActive
            ? 'border-cta bg-cta/20 text-accent-soft'
            : 'border-border text-muted hover:border-cta hover:text-accent-soft'
        }`}
      >
        <Star className="size-3.5" fill={onlyFavActive ? 'currentColor' : 'none'} />
        {t('workout.soloFavoritos')}
      </button>

      <div className="max-h-[38vh] overflow-y-auto border-b border-border px-4 py-2">
        <ExerciseFilterBar filters={filters} onChange={setFiltersPatch} />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {recentExercises.length > 0 && (
          <div className="mb-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <Clock className="size-3.5" aria-hidden />
              {t('workout.recientes')}
            </p>
            <div className="space-y-2">
              {recentExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleSelect(ex)}
                  className="flex min-h-[56px] w-full items-center gap-3 panel rounded-xl px-4 py-3 text-left transition-colors hover:border-gold/80"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg text-accent">
                    <MuscleGroupIcon group={ex.muscleGroup} className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-fg">{localizeExercise(ex, lang).name}</span>
                    <span className="block text-xs capitalize text-muted">
                      {localizeMuscleGroup(ex.muscleGroup, lang)} · {localizeEquipment(ex.equipment, lang)}
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

        {loading ? (
          <div role="status" aria-label={t('workout.cargandoEjercicios')} className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[56px] animate-pulse rounded-xl bg-bg-elevated/60"
              />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted" role="alert">
            {t('workout.cargaError')}
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{t('workout.sinResultados')}</p>
        ) : (
          <div
            ref={listTopRef}
            style={{ height: virtualizer.getTotalSize() }}
            className="relative"
          >
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
                  <PickerRow
                    exercise={ex}
                    isFavorite={favoritesSet.has(ex.id)}
                    onSelect={handleSelect}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
