// @vitest-environment jsdom
// F132.6: filas hairline de la comida seleccionada, con borrado y vacío honesto.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { i18n } from '@/i18n'
import { MealList } from '@/components/nutrition/MealList'
import type { MealEntry } from '@/domain/types'

const meal: MealEntry = {
  id: 7,
  localDate: '2026-10-25',
  mealType: 'almuerzo',
  createdAt: '2026-10-25T12:00:00.000Z',
  items: [
    {
      foodId: 1,
      foodKey: 'chickenBreast',
      grams: 180,
      kcal: 297,
      proteinG: 55.8,
      carbsG: 0,
      fatG: 6.5,
    },
  ],
}

beforeEach(async () => {
  await i18n.changeLanguage('es')
})

afterEach(() => cleanup())

describe('MealList', () => {
  it('muestra nombre, gramos, macros y kcal', () => {
    render(<MealList meals={[meal]} resolveName={() => 'Pechuga de pollo'} onDelete={() => {}} />)
    expect(screen.getByText('Pechuga de pollo')).not.toBeNull()
    expect(screen.getByText(/180 g/)).not.toBeNull()
    expect(screen.getByText(/297/)).not.toBeNull()
  })

  it('borra la entrada completa', () => {
    const onDelete = vi.fn()
    render(<MealList meals={[meal]} resolveName={() => 'Pechuga de pollo'} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Pechuga de pollo' }))
    expect(onDelete).toHaveBeenCalledWith(7)
  })

  it('vacío: no inventa filas ni ceros', () => {
    render(<MealList meals={[]} resolveName={(key) => key} onDelete={() => {}} />)
    expect(screen.getByText('Sin comidas registradas')).not.toBeNull()
    expect(screen.getByText('Agregá los alimentos de esta comida.')).not.toBeNull()
  })
})
