// @vitest-environment jsdom
// 113.followups-3 (a) — R3-CAROUSEL-AUTOADVANCE-BEHAVIOR (lote 13): el audit de fuente
// de sessionCarousel.test.tsx solo pineaba la delegación en `nextAutoAdvance`; acá se
// monta el carrusel con jsdom + RTL y se observa la CONDUCTA del efecto: completar un
// grupo (misma composición ⇒ huella idéntica) centra el scroll en el siguiente, y un
// cambio de composición (borrar un grupo) no mueve el carrusel.
// R3-003 (lote-13.followups): dos casos más del efecto — con prefers-reduced-motion el
// avance usa behavior 'auto', y completar el ÚLTIMO grupo incompleto no scrollea (sin
// destino posterior).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import '@/i18n'
import { SessionCarousel } from '@/components/workout/SessionCarousel'
import type { ActiveExercise, ActiveSet } from '@/store/activeWorkoutStore'
import type { PRRecord } from '@/domain/types'

const set = (id: string, completed: boolean): ActiveSet => ({
  id,
  exerciseId: 1,
  exerciseName: 'Fake',
  setNumber: 1,
  weightKg: 60,
  reps: 10,
  completed,
})

const ex = (exerciseId: number, exerciseName: string, sets: ActiveSet[]): ActiveExercise => ({
  exerciseId,
  exerciseName,
  supersetGroup: undefined,
  sets,
})

// jsdom no tiene layout: offsetLeft/clientWidth valen 0 y todo scroll caería en left=0.
// Con getters por nodo se simulan posiciones para poder distinguir el slide destino.
const SLIDE_STRIDE = 1000
const CONTAINER_WIDTH = 400
const SLIDE_WIDTH = 300
// Left con el que scrollToIndex centra el slide `index`: offset - (contenedor - slide)/2.
const centeredLeft = (index: number): number =>
  (index + 1) * SLIDE_STRIDE - (CONTAINER_WIDTH - SLIDE_WIDTH) / 2

const simulateLayout = (container: Element, slides: Element[]): void => {
  Object.defineProperty(container, 'clientWidth', { configurable: true, get: () => CONTAINER_WIDTH })
  slides.forEach((slide, index) => {
    Object.defineProperty(slide, 'offsetLeft', {
      configurable: true,
      get: () => (index + 1) * SLIDE_STRIDE,
    })
    Object.defineProperty(slide, 'clientWidth', { configurable: true, get: () => SLIDE_WIDTH })
  })
}

const scrollTo = vi.fn()

// matchMedia a nivel módulo: carouselBehavior() lo consulta en cada avance y el
// caso de reduced-motion re-implementa el stub (afterEach restaura el default).
const matchMediaMock = vi.fn(() => ({ matches: false }))

// Props copiadas del render estático de sessionCarousel.test.tsx.
const carousel = (exercises: ActiveExercise[]) => (
  <SessionCarousel
    exercises={exercises}
    prMap={new Map<number, PRRecord>()}
    showRpe={false}
    showRir={false}
    showLoadSuggestion={true}
    loadProgressionPct={2.5}
    units="kg"
    categoryFor={() => 'strength'}
    slugFor={() => undefined}
    noteFor={() => undefined}
    onSuggestionApply={() => {}}
    onSuggestionWarmup={() => {}}
    onCompleteExercise={() => {}}
    onSetCompleted={() => {}}
    onRemoveRequest={() => {}}
    onSetRemoveRequest={() => {}}
  />
)

beforeAll(() => {
  // Sin scrollTo en Element el efecto del carrusel tira TypeError en jsdom.
  Object.defineProperty(Element.prototype, 'scrollTo', {
    configurable: true,
    writable: true,
    value: scrollTo,
  })
  // carouselBehavior() consulta prefers-reduced-motion; sin matchMedia no hay avance suave.
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: matchMediaMock,
  })
})

afterAll(() => {
  delete (Element.prototype as { scrollTo?: unknown }).scrollTo
  delete (window as unknown as { matchMedia?: unknown }).matchMedia
})

afterEach(() => {
  cleanup()
  scrollTo.mockClear()
  matchMediaMock.mockClear()
  // Restaura el default (sin reduced-motion) por si el caso lo re-implementó.
  matchMediaMock.mockImplementation(() => ({ matches: false }))
})

describe('SessionCarousel — auto-avance por contenido (113.followups-3)', () => {
  it('al completar el primer grupo con la misma composición, scrollea al siguiente', () => {
    const { container: view, rerender } = render(
      carousel([
        ex(1, 'Press de banca', [set('s1', false)]),
        ex(2, 'Remo con barra', [set('s2', false)]),
      ])
    )
    const region = view.querySelector('[role="region"]') as HTMLElement
    simulateLayout(region, Array.from(region.children))

    // El scroll de montaje (índice inicial, 'auto') no cuenta para el avance.
    scrollTo.mockClear()

    rerender(
      carousel([
        ex(1, 'Press de banca', [set('s1', true)]),
        ex(2, 'Remo con barra', [set('s2', false)]),
      ])
    )

    // La transición incompleto→completo del grupo 0 (huella 's1' intacta) delega en
    // nextAutoAdvance y centra el grupo 1 con avance suave.
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenCalledWith({ left: centeredLeft(1), behavior: 'smooth' })
  })

  it('quitar un grupo (cambio de composición) no mueve el carrusel', () => {
    const { container: view, rerender } = render(
      carousel([
        ex(1, 'Press de banca', [set('s1', false)]),
        ex(2, 'Remo con barra', [set('s2', false)]),
      ])
    )
    const region = view.querySelector('[role="region"]') as HTMLElement
    simulateLayout(region, Array.from(region.children))
    scrollTo.mockClear()

    rerender(carousel([ex(1, 'Press de banca', [set('s1', false)])]))

    // Sin transición atribuible (el grupo 2 desaparece, no se completa) no hay scroll.
    expect(scrollTo).not.toHaveBeenCalled()
  })

  // R3-003: con prefers-reduced-motion el avance sigue ocurriendo, pero sin animación.
  it('con reduced-motion, completar un grupo avanza con behavior auto (R3-003)', () => {
    matchMediaMock.mockImplementation(() => ({ matches: true }))
    const { container: view, rerender } = render(
      carousel([
        ex(1, 'Press de banca', [set('s1', false)]),
        ex(2, 'Remo con barra', [set('s2', false)]),
      ])
    )
    const region = view.querySelector('[role="region"]') as HTMLElement
    simulateLayout(region, Array.from(region.children))
    scrollTo.mockClear()

    rerender(
      carousel([
        ex(1, 'Press de banca', [set('s1', true)]),
        ex(2, 'Remo con barra', [set('s2', false)]),
      ])
    )

    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenCalledWith({ left: centeredLeft(1), behavior: 'auto' })
  })

  // R3-003: completar el último grupo no mueve el carrusel — no queda ningún
  // incompleto después y no hay destino al que avanzar.
  it('completar el último grupo incompleto no scrollea (R3-003)', () => {
    const { container: view, rerender } = render(
      carousel([
        ex(1, 'Press de banca', [set('s1', false)]),
        ex(2, 'Remo con barra', [set('s2', false)]),
      ])
    )
    const region = view.querySelector('[role="region"]') as HTMLElement
    simulateLayout(region, Array.from(region.children))
    scrollTo.mockClear()

    rerender(
      carousel([
        ex(1, 'Press de banca', [set('s1', false)]),
        ex(2, 'Remo con barra', [set('s2', true)]),
      ])
    )

    expect(scrollTo).not.toHaveBeenCalled()
  })
})
