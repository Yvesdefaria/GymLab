// @vitest-environment jsdom
// F132.6: héroe de adherencia de suplementos.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { i18n } from '@/i18n'
import { SupplementsHero } from '@/components/supplements/SupplementsHero'

beforeEach(async () => {
  await i18n.changeLanguage('es')
})

afterEach(() => cleanup())

describe('SupplementsHero', () => {
  it('muestra tomados, total y pendientes con barra accesible', () => {
    render(<SupplementsHero adherence={{ taken: 3, total: 5, pending: 2, ratio: 0.6 }} />)
    expect(screen.getByText('3')).not.toBeNull()
    expect(screen.getByText(/\/ 5 tomados/)).not.toBeNull()
    expect(screen.getByText(/2 pendientes/)).not.toBeNull()
    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('3')
    expect(bar.getAttribute('aria-valuemax')).toBe('5')
  })

  it('con todo tomado lo dice en verde', () => {
    render(<SupplementsHero adherence={{ taken: 5, total: 5, pending: 0, ratio: 1 }} />)
    const done = screen.getByText('Todo tomado')
    expect(done.className).toContain('text-success')
  })
})
