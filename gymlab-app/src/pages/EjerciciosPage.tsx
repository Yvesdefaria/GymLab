// Página catálogo «Ejercicios» (/ejercicios): lista virtualizada ordenada alfabéticamente,
// índice de letra grande al hacer scroll y rail A–Z para saltar de sección.
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, ChevronRight, Star } from 'lucide-react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import anime from 'animejs'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { ExerciseFilterBar } from '@/components/exercises/ExerciseFilterBar'
import { AlphaRail } from '@/components/exercises/AlphaRail'
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
import { sortAndGroupExercises } from '@/domain/exerciseIndex'
import type { ExerciseSection } from '@/domain/exerciseIndex'
import { prefersReducedMotion } from '@/lib/animations'
import type { Exercise } from '@/domain/types'
import type { AppLanguage } from '@/domain/onboarding'

const ROW_HEIGHT = 64
const HEADER_HEIGHT = 36
const ROW_GAP = 8
// Altura de la cabecera de sección sticky (la misma del título de sección en la lista).
const STICKY_BAR_H = 48

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
      <div       className="flex h-full w-full items-center gap-3 panel-flush rounded-xl border-b border-border/30 px-4 py-3 transition-all hover:border-gold/80 active:scale-[0.98]">
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

// Fila virtualizada: cabecera de sección (letra + conteo) o ejercicio.
type Row = { type: 'header'; key: string; section: ExerciseSection; offset: number } | { type: 'exercise'; key: string; exercise: Exercise; offset: number }

// Catálogo: búsqueda (con debounce), filtros, favoritos y lista alfabética por inicial.
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

  // Secciones alfabéticas (orden localizado). «Comunes» filtra; aquí nunca reordena canónicamente.
  const sections = useMemo(
    () => sortAndGroupExercises(filtered, lang),
    [filtered, lang],
  )

  // Aplana secciones → filas virtualizadas con su offset en px (consistente con alturas fijas).
  const rows = useMemo<Row[]>(() => {
    const result: Row[] = []
    let offset = 0
    for (const section of sections) {
      result.push({ type: 'header', key: `h-${section.letter}`, section, offset })
      offset += HEADER_HEIGHT + ROW_GAP
      for (const ex of section.items) {
        result.push({ type: 'exercise', key: ex.slug, exercise: ex, offset })
        offset += ROW_HEIGHT + ROW_GAP
      }
    }
    return result
  }, [sections])

  const headers = useMemo(
    () => rows.filter((r): r is Extract<Row, { type: 'header' }> => r.type === 'header'),
    [rows],
  )
  const letterOffsets = useMemo(() => {
    const map = new Map<string, number>()
    for (const h of headers) map.set(h.section.letter, h.offset)
    return map
  }, [headers])
  const presentLetters = useMemo(
    () => new Set(sections.map((s) => s.letter)),
    [sections],
  )
  // Abecedario local: la eñe es letra propia en español.
  const alphabet = useMemo(() => {
    const letters = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    if (lang === 'es') letters.splice(letters.indexOf('N') + 1, 0, 'Ñ')
    return letters
  }, [lang])

  const [activeLetter, setActiveLetter] = useState<string>(sections[0]?.letter ?? '')
  useEffect(() => {
    setActiveLetter(headers[0]?.section.letter ?? '')
  }, [headers])

  // La letra grande del índice solo muestra letras reales: el grupo «#» (nombres que
  // no empiezan por letra) no ocupa hueco y el sticky cae a la primera letra válida.
  const bigLetter = activeLetter === '#' ? (headers.find((h) => h.section.letter !== '#')?.section.letter ?? '') : activeLetter

  const listRef = useRef<HTMLDivElement | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  // Offset del índice sticky = header (con safe-area) + altura del índice (64) + gap (8).
  const [stickyOffset, setStickyOffset] = useState(0)
  // Recalcula la posición de la lista y del índice respecto a la ventana.
  useLayoutEffect(() => {
    const el = listRef.current
    if (el) setScrollMargin(el.getBoundingClientRect().top + window.scrollY)
    const header = document.querySelector('header')
    if (header) setStickyOffset(header.getBoundingClientRect().height + STICKY_BAR_H + 8)
  }, [hasActiveFilters, exercises.length, sections.length])

  // Sección activa según el scroll (debajo del índice sticky).
  useEffect(() => {
    if (headers.length === 0) return
    const onScroll = () => {
      const pos = window.scrollY - scrollMargin + stickyOffset
      let letter = headers[0].section.letter
      for (const h of headers) {
        if (h.offset <= pos) letter = h.section.letter
        else break
      }
      setActiveLetter((prev) => (prev === letter ? prev : letter))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [headers, scrollMargin, stickyOffset])

  // Blur-fade (estilo Magic UI) de la letra grande al cambiar de sección.
  const letterRef = useRef<HTMLSpanElement | null>(null)
  const mountedRef = useRef(false)
  useEffect(() => {
    const el = letterRef.current
    if (!el) return
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    if (prefersReducedMotion()) return
    const animation = anime({
      targets: el,
      opacity: [0, 1],
      translateY: [8, 0],
      filter: ['blur(6px)', 'blur(0px)'],
      duration: 260,
      easing: 'easeOutCubic',
    })
    return () => {
      animation.pause()
    }
  }, [bigLetter])

  // Salto del rail: lleva la cabecera de la sección justo debajo del índice sticky.
  // `offset` es relativo a la lista; hay que sumar `scrollMargin` para obtener la Y absoluta.
  const jumpTo = useCallback(
    (letter: string) => {
      const offset = letterOffsets.get(letter)
      if (offset === undefined) return
      window.scrollTo({
        top: Math.max(0, scrollMargin + offset - stickyOffset),
        behavior: 'auto',
      })
    },
    [letterOffsets, scrollMargin, stickyOffset],
  )

  // Virtualización por ventana: cabeceras y filas de altura fija, sin medir en el DOM.
  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: (index) => (rows[index]?.type === 'header' ? HEADER_HEIGHT : ROW_HEIGHT),
    gap: ROW_GAP,
    overscan: 6,
    scrollMargin,
    getItemKey: (index) => rows[index].key,
  })

  return (
    <div>
      <AppHeader
        title={t('ejercicios.titulo')}
        subtitle={t('ejercicios.subtitulo', { count: filtered.length, total: exercises.length })}
      />
      <div className="space-y-4 p-4 pb-6">
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

        {sections.length > 0 && (
          <div className="sticky top-[var(--app-header-h)] z-20 -mx-4 flex h-12 items-center gap-2 border-b border-border/40 bg-bg-elevated/95 px-4 backdrop-blur">
            <span
              key={bigLetter}
              ref={letterRef}
              aria-hidden
              className="text-2xl font-bold leading-none text-accent"
            >
              {bigLetter}
            </span>
            <span className="text-[11px] uppercase tracking-wide text-muted">
              {bigLetter
                ? t('ejercicios.porLetra', {
                    letra: bigLetter,
                    count: headers.find((h) => h.section.letter === bigLetter)?.section.count ?? 0,
                  })
                : ''}
            </span>
          </div>
        )}

        <div ref={listRef}>
          {filtered.length === 0 ? (
            <EmptyState message={t('ejercicios.vacioFiltros')} />
          ) : (
            <div style={{ height: virtualizer.getTotalSize() }} className="relative">
              {virtualizer.getVirtualItems().map((item) => {
                const row = rows[item.index]
                if (!row) return null
                const height = row.type === 'header' ? HEADER_HEIGHT : ROW_HEIGHT
                return (
                  <div
                    key={item.key}
                    style={{
                      height,
                      transform: `translateY(${item.start - scrollMargin}px)`,
                    }}
                    className="absolute left-0 top-0 w-full"
                  >
                    {row.type === 'header' ? (
                      <div
                        role="heading"
                        aria-level={2}
                        className="flex h-full items-center gap-2 px-1"
                      >
                        <span className="text-2xl font-bold leading-none text-accent">
                          {row.section.letter}
                        </span>
                        <span className="text-[11px] uppercase tracking-wide text-muted">
                          {t('ejercicios.porLetra', { letra: row.section.letter, count: row.section.count })}
                        </span>
                      </div>
                    ) : (
                      <ExerciseRow
                        exercise={row.exercise}
                        isFavorite={favoritesSet.has(row.exercise.id)}
                        onToggle={handleToggle}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {sections.length > 0 && (
        <AlphaRail
          alphabet={alphabet}
          activeLetter={activeLetter}
          presentLetters={presentLetters}
          onJump={jumpTo}
        />
      )}
    </div>
  )
}