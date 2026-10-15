// @vitest-environment jsdom
// F121/T4 follow-up (e): los 3 call-sites que normalizan `Element.children`
// con `Array.from` (advisory del review del cierre de follow-ups). Se monta
// cada componente con `animejs` mockeado y se asertá que el target de la
// animación es un Array real de elementos, nunca una HTMLCollection.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'

const { animateSpy } = vi.hoisted(() => ({ animateSpy: vi.fn() }))

vi.mock('animejs', () => ({
  animate: animateSpy,
  stagger: vi.fn(() => ({})),
  utils: { random: (min: number, max: number) => (min + max) / 2 },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'es' } }),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

// El detector tiene sus propios tests: acá se fija UNA alerta para ejercitar
// el efecto de animación del componente.
vi.mock('@/domain/plateauDetector', () => ({
  detectPlateaus: () => [
    {
      exerciseId: 1,
      exerciseName: 'Press banca',
      weeksStagnant: 3,
      currentE1rm: 60,
      previousE1rm: 58,
      suggestion: 'deload',
    },
  ],
}))

import { PlateauAlerts } from '@/components/home/PlateauAlerts'
import { WeeklySummaryCard } from '@/components/home/WeeklySummaryCard'
import { QuickTemplates } from '@/components/quick/QuickTemplates'
import type { WeeklySummary } from '@/domain/weeklySummary'

const setReducedMotion = (matches: boolean): void => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }) as unknown as typeof window.matchMedia
}

// prevSessions: 0 deja correr solo el efecto de los KPIs (el del trend retorna).
const summary: WeeklySummary = {
  sessions: 3,
  volume: 12000,
  prCount: 1,
  bestDay: null,
  bestDayVolume: 0,
  prevSessions: 0,
  prevVolume: 0,
  volumePct: 0,
  sessionsDelta: 3,
  tone: 'neutral',
  streakCurrent: 2,
  streakMax: 5,
}

beforeEach(() => {
  animateSpy.mockClear()
  setReducedMotion(false)
})

afterEach(() => {
  cleanup()
})

describe('call-sites con Array.from — contrato del target (f121.t4-e)', () => {
  // La llamada bajo contrato es la que lleva targets de lista: un Array real no
  // vacío (con HTMLCollection `Array.isArray` es false y el find no la encuentra).
  const findListCall = (): [unknown[]] | undefined =>
    animateSpy.mock.calls.find(
      ([targets]) => Array.isArray(targets) && (targets as unknown[]).length > 0,
    ) as [unknown[]] | undefined

  it('PlateauAlerts: anima un Array real con los hijos de la lista', () => {
    render(<PlateauAlerts sets={[]} exercises={[]} />)
    const listCall = findListCall()
    expect(listCall).toBeDefined()
    const [targets] = listCall as [unknown[]]
    expect(targets.length).toBe(1)
    expect(targets[0]).toBeInstanceOf(Element)
    expect((targets[0] as HTMLElement).textContent).toContain('Press banca')
  })

  it('WeeklySummaryCard: anima un Array real con los KPIs', () => {
    render(<WeeklySummaryCard summary={summary} units="kg" />)
    const listCall = findListCall()
    expect(listCall).toBeDefined()
    const [targets] = listCall as [unknown[]]
    expect(targets.length).toBeGreaterThan(0)
    expect(targets.every((t) => t instanceof Element)).toBe(true)
  })

  it('QuickTemplates: anima un Array real con los hijos del contenedor', () => {
    render(<QuickTemplates exercises={[]} />)
    const listCall = findListCall()
    expect(listCall).toBeDefined()
    const [targets] = listCall as [unknown[]]
    expect(targets.length).toBeGreaterThan(0)
    expect(targets.every((t) => t instanceof Element)).toBe(true)
  })
})
