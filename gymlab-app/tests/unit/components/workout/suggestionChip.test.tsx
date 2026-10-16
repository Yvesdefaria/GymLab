// @vitest-environment jsdom
// F118: el chip muestra el copy por clave (neutro con objetivo vs. con margen), reenvía
// el objetivo ABSOLUTO del motor (`targetKg`) al aplicar —los tests no deben pasar si
// el chip mandara el delta visible— y con `capped` muestra el aviso del récord.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'

// El mock conserva la clave y las variables de interpolación para asertar lo renderizado.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => `${key}|${JSON.stringify(opts ?? {})}`,
    i18n: { language: 'es' },
  }),
}))

import { SuggestionChip } from '@/components/workout/SuggestionChip'
import type { SessionSuggestion } from '@/domain/sessionSuggestions'

const suggestion = (overrides: Partial<SessionSuggestion> = {}): SessionSuggestion => ({
  id: 'increase-1',
  type: 'increase',
  exerciseId: 1,
  messageKey: 'suggestions.increaseWeightNeutral',
  priority: 'high',
  data: { amount: 2.5, target: 62.5 },
  action: { kind: 'applyWeight', targetKg: 62.5 },
  ...overrides,
})

afterEach(() => cleanup())

describe('SuggestionChip — copy y acción absoluta (F118)', () => {
  it('el mensaje neutro usa su clave y muestra el objetivo formateado (es-ES)', () => {
    const { container } = render(<SuggestionChip suggestion={suggestion()} />)
    const text = container.textContent ?? ''
    expect(text).toContain('suggestions.increaseWeightNeutral')
    expect(text).toContain('62,5')
  })

  it('el tap aplica el objetivo ABSOLUTO del motor (no el delta visible)', () => {
    const onApply = vi.fn()
    const { container } = render(<SuggestionChip suggestion={suggestion()} onApply={onApply} />)
    const applyButton = container.querySelector('button')
    expect(applyButton).not.toBeNull()
    fireEvent.click(applyButton as HTMLButtonElement)
    expect(onApply).toHaveBeenCalledWith(1, 62.5)
  })

  it('con capped muestra el aviso del récord junto al chip', () => {
    const { container } = render(<SuggestionChip suggestion={suggestion({ capped: true })} />)
    expect(container.textContent).toContain('workout.cappedByPr')
  })

  it('sin capped no muestra el aviso del récord', () => {
    const { container } = render(<SuggestionChip suggestion={suggestion()} />)
    expect(container.textContent).not.toContain('workout.cappedByPr')
  })
})
