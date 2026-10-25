// @vitest-environment jsdom
// F132.6: tabs por comida con subtotal y estado vacío honesto.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { i18n } from '@/i18n'
import { MealTabs } from '@/components/nutrition/MealTabs'

beforeEach(async () => {
  await i18n.changeLanguage('es')
})

afterEach(() => cleanup())

describe('MealTabs', () => {
  it('muestra el subtotal de cada comida y «—» cuando no hay datos', () => {
    render(
      <MealTabs
        value="almuerzo"
        onChange={() => {}}
        subtotals={{ desayuno: 420, almuerzo: 604, cena: 0, snack: 456 }}
      />
    )
    expect(screen.getByRole('button', { name: /Almuerzo/ }).textContent).toContain('604 kcal')
    expect(screen.getByRole('button', { name: /Cena/ }).textContent).toContain('—')
  })

  it('marca el activo y avisa el cambio', () => {
    const onChange = vi.fn()
    render(
      <MealTabs
        value="almuerzo"
        onChange={onChange}
        subtotals={{ desayuno: 420, almuerzo: 604, cena: 0, snack: 456 }}
      />
    )
    expect(screen.getByRole('button', { name: /Almuerzo/ }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: /Desayuno/ }))
    expect(onChange).toHaveBeenCalledWith('desayuno')
  })
})
