// @vitest-environment jsdom
// F132.6: héroe de Nutrición. Pinnea el objetivo real, el estado sin objetivo
// (sin inventar 2.200 kcal) y el reparto de macros sobre las kcal consumidas.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { i18n } from '@/i18n'
import { NutritionHero } from '@/components/nutrition/NutritionHero'

const totals = { kcal: 1480, proteinG: 142, carbsG: 120, fatG: 48 }

const renderHero = (goal?: number) =>
  render(
    <MemoryRouter>
      <NutritionHero totals={totals} goal={goal} />
    </MemoryRouter>
  )

beforeEach(async () => {
  await i18n.changeLanguage('es')
})

afterEach(() => cleanup())

describe('NutritionHero', () => {
  it('muestra consumido, objetivo y restantes', () => {
    renderHero(2200)
    expect(screen.getByText(/1[.]?480/)).not.toBeNull()
    expect(screen.getByText(/de 2[.]?200 kcal/)).not.toBeNull()
    expect(screen.getByTestId('nutrition-remaining').textContent).toContain('720 kcal disponibles')
    const ring = screen.getByRole('progressbar')
    expect(ring.getAttribute('aria-valuenow')).toBe('1480')
    expect(ring.getAttribute('aria-valuemax')).toBe('2200')
  })

  it('reparte los macros sobre las kcal y suma 100', () => {
    renderHero(2200)
    expect(screen.getByText('38% de las kcal')).not.toBeNull()
    expect(screen.getByText('33% de las kcal')).not.toBeNull()
    expect(screen.getByText('29% de las kcal')).not.toBeNull()
  })

  it('sin objetivo no inventa un anillo ni un número de meta', () => {
    renderHero(undefined)
    expect(screen.getByText('Sin objetivo diario')).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Ir a Perfil' }).getAttribute('href')).toBe('/perfil')
    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(screen.queryByText(/de 2[.]?200 kcal/)).toBeNull()
  })

  it('si se pasa del objetivo lo dice sin usar rojo', () => {
    renderHero(2200)
    cleanup()
    render(
      <MemoryRouter>
        <NutritionHero totals={{ ...totals, kcal: 2400 }} goal={2200} />
      </MemoryRouter>
    )
    const over = screen.getByTestId('nutrition-over')
    expect(over.textContent).toContain('200 kcal por encima')
    expect(over.className).not.toContain('text-danger')
  })

  it('al llegar exacto al objetivo muestra el logro, no «0 por encima»', () => {
    render(
      <MemoryRouter>
        <NutritionHero totals={{ ...totals, kcal: 2200 }} goal={2200} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('nutrition-reached').textContent).toBe('Objetivo alcanzado')
    expect(screen.queryByTestId('nutrition-over')).toBeNull()
  })

  it('sin kcal consumidas muestra los macros en cero y sin porcentaje', () => {
    render(
      <MemoryRouter>
        <NutritionHero totals={{ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }} goal={2200} />
      </MemoryRouter>
    )
    for (const macro of ['nutrition.protein', 'nutrition.carbs', 'nutrition.fat']) {
      const cell = document.querySelector(`[data-macro="${macro}"]`)
      expect(cell?.textContent).toContain('0g')
      expect(cell?.textContent).toContain('—')
    }
  })
})
