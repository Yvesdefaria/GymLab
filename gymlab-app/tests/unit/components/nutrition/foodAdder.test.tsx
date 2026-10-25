// @vitest-environment jsdom
// F132.6: el alta de comida conserva búsqueda, gramos y confirmación; tras
// agregar deja el formulario listo para cargar otro alimento.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { i18n } from '@/i18n'
import { FoodAdder } from '@/components/nutrition/FoodAdder'
import type { FoodWithDisplayName } from '@/hooks/useFoods'

const foods: FoodWithDisplayName[] = [
  {
    id: 1,
    foodKey: 'chickenBreast',
    name: 'Pechuga de pollo',
    displayName: 'Pechuga de pollo',
    kcal: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
    category: 'proteina',
    raw: true,
  },
]

beforeEach(async () => {
  await i18n.changeLanguage('es')
})

afterEach(() => cleanup())

describe('FoodAdder', () => {
  it('busca, elige y agrega con la fecha y comida recibidas', () => {
    const onAdd = vi.fn()
    render(
      <FoodAdder
        foods={foods}
        addCustomFood={async () => 1}
        onAdd={onAdd}
        today="2026-10-25"
        mealType="almuerzo"
      />
    )
    fireEvent.change(screen.getByPlaceholderText('Buscar alimento...'), {
      target: { value: 'pollo' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Pechuga de pollo/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }))
    expect(onAdd).toHaveBeenCalledWith({
      localDate: '2026-10-25',
      mealType: 'almuerzo',
      items: [expect.objectContaining({ foodKey: 'chickenBreast', kcal: 165 })],
    })
    expect(screen.getByText('Agregado: Pechuga de pollo')).not.toBeNull()
    expect((screen.getByPlaceholderText('Buscar alimento...') as HTMLInputElement).value).toBe('')
  })

  it('sin resultados avisa sin inventar alimentos', () => {
    render(
      <FoodAdder
        foods={foods}
        addCustomFood={async () => 1}
        onAdd={() => {}}
        today="2026-10-25"
        mealType="almuerzo"
      />
    )
    fireEvent.change(screen.getByPlaceholderText('Buscar alimento...'), {
      target: { value: 'zzz' },
    })
    expect(screen.getByText('No se encontraron alimentos')).not.toBeNull()
  })
})
