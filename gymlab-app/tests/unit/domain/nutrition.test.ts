import { describe, expect, it } from 'vitest'
import { calculateDailyTotals, calculateFoodMacros, FOOD_SEED } from '@/domain/nutrition'
import type { FoodItem, MealEntry } from '@/domain/types'

const makeMeal = (items: MealEntry['items'], localDate = '2026-08-23'): MealEntry => ({
  id: 1,
  localDate,
  mealType: 'almuerzo',
  items,
  createdAt: new Date().toISOString(),
})

const fakeFood: FoodItem = {
  id: 1,
  name: 'Pechuga de pollo',
  kcal: 165,
  proteinG: 31,
  carbsG: 0,
  fatG: 3.6,
  category: 'proteina',
}

describe('FOOD_SEED', () => {
  it('tiene al menos 40 alimentos', () => {
    expect(FOOD_SEED.length).toBeGreaterThanOrEqual(40)
  })

  it('cada alimento tiene name, kcal, proteinG, carbsG, fatG y category', () => {
    for (const f of FOOD_SEED) {
      expect(typeof f.name).toBe('string')
      expect(f.name.length).toBeGreaterThan(0)
      expect(typeof f.kcal).toBe('number')
      expect(f.kcal).toBeGreaterThanOrEqual(0)
      expect(typeof f.proteinG).toBe('number')
      expect(typeof f.carbsG).toBe('number')
      expect(typeof f.fatG).toBe('number')
      expect(typeof f.category).toBe('string')
    }
  })

  it('hay alimentos de al menos 3 categorías distintas', () => {
    const cats = new Set(FOOD_SEED.map((f) => f.category))
    expect(cats.size).toBeGreaterThanOrEqual(3)
  })
})

describe('calculateFoodMacros', () => {
  it('calcula macros para 100g (factor = 1)', () => {
    const result = calculateFoodMacros(fakeFood, 100)
    expect(result.kcal).toBe(165)
    expect(result.proteinG).toBe(31)
    expect(result.carbsG).toBe(0)
    expect(result.fatG).toBe(3.6)
    expect(result.foodId).toBe(1)
    expect(result.foodName).toBe('Pechuga de pollo')
    expect(result.grams).toBe(100)
  })

  it('escala correctamente para 200g', () => {
    const result = calculateFoodMacros(fakeFood, 200)
    expect(result.kcal).toBe(330)
    expect(result.proteinG).toBe(62)
    expect(result.fatG).toBe(7.2)
  })

  it('escala correctamente para 50g', () => {
    const result = calculateFoodMacros(fakeFood, 50)
    expect(result.kcal).toBe(83) // round(165 * 0.5) = 83
    expect(result.proteinG).toBe(15.5)
  })

  it('0g produce 0 en todo', () => {
    const result = calculateFoodMacros(fakeFood, 0)
    expect(result.kcal).toBe(0)
    expect(result.proteinG).toBe(0)
    expect(result.carbsG).toBe(0)
    expect(result.fatG).toBe(0)
  })

  it('redondea kcal al entero más cercano', () => {
    const food: FoodItem = { ...fakeFood, kcal: 133 }
    const result = calculateFoodMacros(food, 75)
    // 133 * 0.75 = 99.75 → 100
    expect(result.kcal).toBe(100)
  })

  it('redondea macros a 1 decimal', () => {
    const food: FoodItem = { ...fakeFood, proteinG: 31, fatG: 3.6 }
    const result = calculateFoodMacros(food, 33)
    // 31 * 0.33 = 10.23 → 10.2
    expect(result.proteinG).toBe(10.2)
    // 3.6 * 0.33 = 1.188 → 1.2
    expect(result.fatG).toBe(1.2)
  })
})

describe('calculateDailyTotals', () => {
  it('devuelve ceros si no hay comidas', () => {
    const result = calculateDailyTotals([])
    expect(result).toEqual({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 })
  })

  it('suma una sola comida correctamente', () => {
    const item = calculateFoodMacros(fakeFood, 100)
    const meals = [makeMeal([item])]
    const result = calculateDailyTotals(meals)
    expect(result.kcal).toBe(165)
    expect(result.proteinG).toBe(31)
  })

  it('suma múltiples comidas del mismo día', () => {
    const item1 = calculateFoodMacros(fakeFood, 100)
    const rice: FoodItem = { ...fakeFood, id: 2, name: 'Arroz', kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 }
    const item2 = calculateFoodMacros(rice, 200)
    const meals = [makeMeal([item1]), makeMeal([item2])]
    const result = calculateDailyTotals(meals)
    expect(result.kcal).toBe(165 + 260) // 425
    expect(result.carbsG).toBe(+(0 + 56).toFixed(1))
  })

  it('ignora comidas de otros días (solo suma las dadas)', () => {
    const item = calculateFoodMacros(fakeFood, 100)
    const todayMeal = makeMeal([item], '2026-08-23')
    const yesterdayMeal = makeMeal([item], '2026-08-22')
    const result = calculateDailyTotals([todayMeal, yesterdayMeal])
    // Todas las comidas del array se suman (la función no filtra por fecha)
    expect(result.kcal).toBe(165 * 2)
  })

  it('suma correctamente muchos items en una comida', () => {
    const foods: FoodItem[] = [
      { ...fakeFood, id: 1, kcal: 100, proteinG: 10, carbsG: 0, fatG: 2 },
      { ...fakeFood, id: 2, kcal: 200, proteinG: 5, carbsG: 30, fatG: 8 },
      { ...fakeFood, id: 3, kcal: 50, proteinG: 3, carbsG: 5, fatG: 1 },
    ]
    const items = foods.map((f) => calculateFoodMacros(f, 100))
    const result = calculateDailyTotals([makeMeal(items)])
    expect(result.kcal).toBe(350)
    expect(result.proteinG).toBe(18)
    expect(result.carbsG).toBe(35)
    expect(result.fatG).toBe(11)
  })
})
