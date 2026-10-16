// @vitest-environment jsdom
// F118/F122: el chip muestra el copy por clave, reenvía el objetivo ABSOLUTO del motor
// (`targetKg`) al aplicar —los tests no deben pasar si el chip mandara el delta visible—
// y con `capped` muestra el aviso del récord. F122: la subida ya no se genera; el chip
// cubre las señales de seguridad (bajar/descanso/rendimiento/calentamiento).
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
  id: 'decrease-1',
  type: 'decrease',
  exerciseId: 1,
  messageKey: 'suggestions.decreaseWeight',
  priority: 'high',
  data: { amount: 2.5, target: 57.5 },
  action: { kind: 'applyWeight', targetKg: 57.5 },
  ...overrides,
})

afterEach(() => cleanup())

describe('SuggestionChip — copy y acción absoluta (F118/F122)', () => {
  it('el mensaje de bajar usa su clave y formatea el importe (es-ES)', () => {
    const { container } = render(<SuggestionChip suggestion={suggestion()} />)
    const text = container.textContent ?? ''
    expect(text).toContain('suggestions.decreaseWeight')
    expect(text).toContain('2,5')
  })

  it('el tap aplica el objetivo ABSOLUTO del motor (no el delta visible)', () => {
    const onApply = vi.fn()
    const { getByText } = render(<SuggestionChip suggestion={suggestion()} onApply={onApply} />)
    // Se busca por el texto del botón de aplicar, no por el orden del DOM.
    fireEvent.click(getByText(/suggestions\.applyDecrease/))
    expect(onApply).toHaveBeenCalledWith(1, 57.5)
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
