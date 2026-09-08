import { describe, expect, it } from 'vitest'
import { calculateDailyTotals, calculateFoodMacros, calcMealTypeTotals, MEAL_TYPE_ORDER, FOOD_SEED, adjustTdeeForSteps } from '@/domain/nutrition'
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
  foodKey: 'chickenBreast',
  kcal: 165,
  proteinG: 31,
  carbsG: 0,
  fatG: 3.6,
  category: 'proteina',
  raw: true,
}

describe('FOOD_SEED', () => {
  it('tiene al menos 100 alimentos', () => {
    expect(FOOD_SEED.length).toBeGreaterThanOrEqual(100)
  })

  it('cada alimento tiene foodKey, name, kcal, proteinG, carbsG, fatG, category y raw', () => {
    for (const f of FOOD_SEED) {
      expect(typeof f.foodKey).toBe('string')
      expect(f.foodKey.length).toBeGreaterThan(0)
      expect(typeof f.name).toBe('string')
      expect(f.name.length).toBeGreaterThan(0)
      expect(typeof f.kcal).toBe('number')
      expect(f.kcal).toBeGreaterThanOrEqual(0)
      expect(typeof f.proteinG).toBe('number')
      expect(typeof f.carbsG).toBe('number')
      expect(typeof f.fatG).toBe('number')
      expect(typeof f.category).toBe('string')
      expect(f.raw).toBe(true)
    }
  })

  it('foodKeys son únicos', () => {
    const keys = FOOD_SEED.map((f) => f.foodKey)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('hay alimentos de al menos 5 categorías distintas', () => {
    const cats = new Set(FOOD_SEED.map((f) => f.category))
    expect(cats.size).toBeGreaterThanOrEqual(5)
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
    expect(result.foodKey).toBe('chickenBreast')
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
    expect(result.kcal).toBe(83)
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
    expect(result.kcal).toBe(100)
  })

  it('redondea macros a 1 decimal', () => {
    const food: FoodItem = { ...fakeFood, proteinG: 31, fatG: 3.6 }
    const result = calculateFoodMacros(food, 33)
    expect(result.proteinG).toBe(10.2)
    expect(result.fatG).toBe(1.2)
  })

  it('usa baseGrams cuando está definido', () => {
    const food: FoodItem = { ...fakeFood, baseGrams: 250, kcal: 100 }
    const result = calculateFoodMacros(food, 125)
    // factor = 125/250 = 0.5
    expect(result.kcal).toBe(50)
  })
})

describe('calcMealTypeTotals', () => {
  it('devuelve un mapa vacío si no hay comidas', () => {
    expect(calcMealTypeTotals([])).toEqual({})
  })

  it('agrupa comidas por tipo con su total de kcal y la lista de comidas', () => {
    const chicken = calculateFoodMacros(fakeFood, 100) // 165 kcal
    const rice: FoodItem = { ...fakeFood, id: 2, foodKey: 'rice', name: 'Arroz', kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 }
    const ricePortion = calculateFoodMacros(rice, 200) // 260 kcal

    const desayuno: MealEntry = { ...makeMeal([chicken]), id: 1, mealType: 'desayuno' }
    const almuerzo: MealEntry = { ...makeMeal([chicken]), id: 2, mealType: 'almuerzo' }
    const cena: MealEntry = { ...makeMeal([ricePortion]), id: 3, mealType: 'cena' }

    const result = calcMealTypeTotals([desayuno, almuerzo, cena])
    expect(result.desayuno?.kcal).toBe(165)
    expect(result.desayuno?.meals).toHaveLength(1)
    expect(result.almuerzo?.kcal).toBe(165)
    expect(result.cena?.kcal).toBe(260)
    expect(Object.keys(result).sort()).toEqual(['almuerzo', 'cena', 'desayuno'])
  })

  it('suma varias comidas del mismo tipo en un solo subtotal', () => {
    const chicken = calculateFoodMacros(fakeFood, 100)
    const snack1: MealEntry = { ...makeMeal([chicken]), id: 1, mealType: 'snack' }
    const snack2: MealEntry = { ...makeMeal([chicken]), id: 2, mealType: 'snack' }
    const result = calcMealTypeTotals([snack1, snack2])
    expect(result.snack?.kcal).toBe(330)
    expect(result.snack?.meals).toHaveLength(2)
  })

  it('mantiene el orden definido de MealType en las claves presentes', () => {
    const chicken = calculateFoodMacros(fakeFood, 100)
    const cena: MealEntry = { ...makeMeal([chicken]), id: 1, mealType: 'cena' }
    const desayuno: MealEntry = { ...makeMeal([chicken]), id: 2, mealType: 'desayuno' }
    const result = calcMealTypeTotals([cena, desayuno])
    const order = MEAL_TYPE_ORDER.filter((t) => result[t])
    expect(order).toEqual(['desayuno', 'cena'])
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
    const rice: FoodItem = { ...fakeFood, id: 2, foodKey: 'rice', name: 'Arroz', kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 }
    const item2 = calculateFoodMacros(rice, 200)
    const meals = [makeMeal([item1]), makeMeal([item2])]
    const result = calculateDailyTotals(meals)
    expect(result.kcal).toBe(165 + 260)
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

describe('adjustTdeeForSteps', () => {
  it('sin pasos deja el TDEE intacto (0 añade 0 kcal)', () => {
    expect(adjustTdeeForSteps(2_200, 0)).toBe(2_200)
  })

  it('10.000 pasos suman 400 kcal (pasos × 0.04)', () => {
    expect(adjustTdeeForSteps(2_200, 10_000)).toBe(2_600)
  })

  it('es proporcional: 5.000 pasos suman 200 kcal', () => {
    expect(adjustTdeeForSteps(2_200, 5_000)).toBe(2_400)
  })

  it('respetando la base de cálculo de stepsTracker (pasos × 0.04)', () => {
    // Reutiliza calculateCalories: 12.345 pasos → 493,8 kcal exactas.
    expect(adjustTdeeForSteps(2_200, 12_345)).toBe(2_200 + 12_345 * 0.04)
  })
})
