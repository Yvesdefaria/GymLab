// Carrusel horizontal de la sesión activa: un slide por grupo (ejercicio suelto o superserie)
// con indicador y auto-avance al siguiente grupo incompleto. Reemplaza a SessionGroupList:
// el auto-avance pasa de scrollIntoView a scrollTo del contenedor (refs por slide).
// Todos los slides quedan montados (sin virtualización) y `touch-action` deja libres ambos
// ejes, para que el scroll vertical de la página siga funcionando desde dentro del carrusel.
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCheck, Link2 } from 'lucide-react'
import { ExerciseBlock } from '@/components/workout/ExerciseBlock'
import { SessionCarouselIndicator } from '@/components/workout/SessionCarouselIndicator'
import {
  clampGroupIndex,
  firstIncompleteGroupIndex,
  groupExercises,
  isGroupComplete,
  nextIncompleteGroupIndex,
  uniqueGroupKeys,
} from '@/domain/sessionGroups'
import type { ActiveExercise } from '@/store/activeWorkoutStore'
import type { Units } from '@/domain/settings'
import type { PRRecord, BodyWeightEntry } from '@/domain/types'
import type { SessionSuggestion } from '@/domain/sessionSuggestions'

interface SessionCarouselProps {
  exercises: ActiveExercise[]
  prMap: Map<number, PRRecord>
  showRpe: boolean
  showRir: boolean
  // Ajustes de sugerencia de carga leídos una sola vez en la página y repartidos a
  // cada bloque (F120/CAR-2).
  showLoadSuggestion: boolean
  loadProgressionPct: number
  units: Units
  categoryFor: (exerciseId: number) => string | undefined
  slugFor: (exerciseId: number) => string | undefined
  noteFor: (exerciseId: number) => string | undefined
  deloadActive?: boolean
  // Peso corporal de hoy, consultado una sola vez a nivel de página (tarea 91.2).
  bodyWeight?: BodyWeightEntry
  // Promedio de carga reciente por ejercicio (F97.4), leído una sola vez a nivel de página.
  loadAverages?: Map<number, number>
  // Sugerencia en vivo por ejercicio (F98.2): Map estable calculado una vez en la página.
  suggestions?: Map<number, SessionSuggestion>
  onSuggestionApply: (exerciseId: number, amountKg: number) => void
  onSuggestionWarmup: (exerciseId: number, warmupWeightKg: number) => void
  onCompleteExercise: (exerciseId: number) => void
  onSetCompleted: (exerciseId: number, setId: string, completed: boolean) => void
  onRemoveRequest: (exerciseId: number) => void
  onSetRemoveRequest: (exerciseId: number, setId: string) => void
}

// Auto-avance suave salvo con prefers-reduced-motion (misma regla que F34c).
const carouselBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

export const SessionCarousel = memo(({
  exercises,
  prMap,
  showRpe,
  showRir,
  showLoadSuggestion,
  loadProgressionPct,
  units,
  categoryFor,
  slugFor,
  noteFor,
  deloadActive,
  bodyWeight,
  loadAverages,
  suggestions,
  onSuggestionApply,
  onSuggestionWarmup,
  onCompleteExercise,
  onSetCompleted,
  onRemoveRequest,
  onSetRemoveRequest,
}: SessionCarouselProps) => {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollTimer = useRef<number | undefined>(undefined)
  // Estado del render anterior por identidad de grupo: el auto-avance solo dispara en la
  // transición incompleto → completo (F34c); agregar un ejercicio al final no salta de slide.
  const completionRef = useRef<Map<string, boolean>>(new Map())
  const groups = useMemo(() => groupExercises(exercises), [exercises])
  // Identidad única por grupo (R3-001): `group.key` colisiona con dos sueltos idénticos
  // consecutivos; se usa para la key de React y para el mapa de transiciones.
  const groupKeys = useMemo(() => uniqueGroupKeys(groups), [groups])
  const [activeIndex, setActiveIndex] = useState(() => firstIncompleteGroupIndex(groups))
  const groupCount = groups.length

  // Centra un slide en el carrusel. El contenedor es `relative`, así que offsetLeft se mide
  // contra él; el snap mandatory termina de ajustar cualquier diferencia a la posición exacta.
  const scrollToIndex = (index: number, behavior: ScrollBehavior) => {
    const container = containerRef.current
    const slide = slideRefs.current[index]
    if (!container || !slide) return
    container.scrollTo({
      left: slide.offsetLeft - (container.clientWidth - slide.clientWidth) / 2,
      behavior,
    })
  }

  // Arranque en el primer grupo incompleto (o el primero si no hay ninguno). useLayoutEffect
  // para que el salto inicial no se vea como un parpadeo desde el slide 0.
  useLayoutEffect(() => {
    const target = firstIncompleteGroupIndex(groups)
    setActiveIndex(target)
    scrollToIndex(target, 'auto')
    // Solo al montar: las mutaciones de grupos se atienden en los efectos de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- la posición inicial se congela al montar
  }, [])

  // Auto-avance (F34c): un grupo que pasa a completo desliza el carrusel al siguiente grupo
  // incompleto; si no queda ninguno después, no se mueve.
  useEffect(() => {
    const previous = completionRef.current
    const current = new Map<string, boolean>()
    let advanced = false
    groups.forEach((group, index) => {
      const complete = isGroupComplete(group)
      current.set(groupKeys[index], complete)
      if (advanced || previous.get(groupKeys[index]) !== false || !complete) return
      const target = nextIncompleteGroupIndex(groups, index)
      if (target !== null) {
        scrollToIndex(target, carouselBehavior())
        advanced = true
      }
    })
    completionRef.current = current
  }, [groups, groupKeys])

  // Mutaciones: si quitar un ejercicio/serie vacía un grupo, el índice activo puede quedar
  // fuera de rango; se reposiciona al grupo válido más cercano (siguiente; si no, anterior).
  useEffect(() => {
    if (activeIndex < groupCount) return
    const target = clampGroupIndex(activeIndex, groupCount)
    setActiveIndex(target)
    scrollToIndex(target, 'auto')
  }, [activeIndex, groupCount])

  // El contador sigue al slide EN REPOSO: el índice se recalcula cuando el scroll se detiene
  // (fin del snap), nunca a mitad de swipe.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onScroll = () => {
      window.clearTimeout(scrollTimer.current)
      scrollTimer.current = window.setTimeout(() => {
        const center = container.scrollLeft + container.clientWidth / 2
        let best = 0
        let bestDistance = Number.POSITIVE_INFINITY
        groups.forEach((_, index) => {
          const slide = slideRefs.current[index]
          if (!slide) return
          const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center)
          if (distance < bestDistance) {
            bestDistance = distance
            best = index
          }
        })
        setActiveIndex(best)
      }, 90)
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', onScroll)
      window.clearTimeout(scrollTimer.current)
    }
  }, [groups])

  return (
    <section className="space-y-1">
      <SessionCarouselIndicator groups={groups} activeIndex={activeIndex} />
      <div
        ref={containerRef}
        role="region"
        aria-label={t('session.carruselAria')}
        // pan-x pan-y (no el touch-pan-x de HScroll): el eje vertical queda libre para el
        // scroll de la página desde dentro del carrusel; pinch-zoom no se degrada.
        style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
        className="scrollbar-hidden relative -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4"
      >
        {groups.map((group, index) => {
          const isSuper = group.label !== null
          const complete = isGroupComplete(group)
          return (
            <div
              key={groupKeys[index]}
              ref={(el) => {
                slideRefs.current[index] = el
              }}
              role="group"
              aria-label={
                isSuper
                  ? t('session.superserieDeGrupos', {
                      actual: index + 1,
                      total: groupCount,
                      nombres: group.exercises.map((ex) => ex.exerciseName).join(', '),
                    })
                  : t('session.ejercicioDeGrupos', {
                      actual: index + 1,
                      total: groupCount,
                      nombre: group.exercises[0]?.exerciseName ?? '',
                    })
              }
              className={`w-[88%] shrink-0 snap-center ${
                isSuper
                  ? `space-y-3 rounded-2xl border p-2 ${
                      complete ? 'border-success/40 bg-success/5' : 'border-cta/40 bg-cta/5'
                    }`
                  : ''
              }`}
            >
              {isSuper && (
                <div className="flex items-center gap-2 px-2 pt-1">
                  <Link2 className="size-4 shrink-0 text-cta" aria-hidden />
                  <span className="font-display text-sm font-semibold uppercase tracking-wide text-accent-soft">
                    {t('session.superserie', { grupo: group.label })}
                  </span>
                  {complete ? (
                    <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-success">
                      <CheckCheck className="size-3" aria-hidden /> {t('session.completada')}
                    </span>
                  ) : null}
                </div>
              )}
              {group.exercises.map((ex) => (
                <ExerciseBlock
                  key={ex.exerciseId}
                  exerciseId={ex.exerciseId}
                  prMap={prMap}
                  showRpe={showRpe}
                  showRir={showRir}
                  showLoadSuggestion={showLoadSuggestion}
                  loadProgressionPct={loadProgressionPct}
                  units={units}
                  isCardio={categoryFor(ex.exerciseId) === 'cardio'}
                  exerciseSlug={slugFor(ex.exerciseId)}
                  note={noteFor(ex.exerciseId)}
                  deloadActive={deloadActive}
                  bodyWeight={bodyWeight}
                  recentTopSetAvgKg={loadAverages?.get(ex.exerciseId) ?? 0}
                  liveSuggestion={suggestions?.get(ex.exerciseId)}
                  onSuggestionApply={onSuggestionApply}
                  onSuggestionWarmup={onSuggestionWarmup}
                  onCompleteExercise={onCompleteExercise}
                  onSetCompleted={onSetCompleted}
                  onRemoveRequest={onRemoveRequest}
                  onSetRemoveRequest={onSetRemoveRequest}
                />
              ))}
            </div>
          )
        })}
      </div>
    </section>
  )
})
