// Nutrición: seed de alimentos comunes y funciones de cálculo de totales diarios.
import type { FoodItem, MealEntry, MealFoodEntry } from './types'

// Seed de ~50 alimentos comunes (por 100g).
export const FOOD_SEED: Omit<FoodItem, 'id'>[] = [
  // Proteínas
  { name: 'Pechuga de pollo', kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6, category: 'proteina' },
  { name: 'Pechuga de pavo', kcal: 135, proteinG: 30, carbsG: 0, fatG: 1, category: 'proteina' },
  { name: 'Huevo entero', kcal: 155, proteinG: 13, carbsG: 1.1, fatG: 11, category: 'proteina' },
  { name: 'Clara de huevo', kcal: 52, proteinG: 11, carbsG: 0.7, fatG: 0.2, category: 'proteina' },
  { name: 'Salmón', kcal: 208, proteinG: 20, carbsG: 0, fatG: 13, category: 'proteina' },
  { name: 'Atún enlatado', kcal: 130, proteinG: 29, carbsG: 0, fatG: 1, category: 'proteina' },
  { name: 'Carne molida magra', kcal: 250, proteinG: 26, carbsG: 0, fatG: 15, category: 'proteina' },
  { name: 'Lomo de cerdo', kcal: 143, proteinG: 26, carbsG: 0, fatG: 3.5, category: 'proteina' },
  { name: 'Ternera', kcal: 250, proteinG: 26, carbsG: 0, fatG: 15, category: 'proteina' },
  { name: 'Tofu firme', kcal: 144, proteinG: 15, carbsG: 3.5, fatG: 8, category: 'proteina' },
  // Carbohidratos
  { name: 'Arroz blanco cocido', kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, category: 'carbohidrato' },
  { name: 'Arroz integral cocido', kcal: 123, proteinG: 2.7, carbsG: 26, fatG: 1, category: 'carbohidrato' },
  { name: 'Pasta cocida', kcal: 131, proteinG: 5, carbsG: 25, fatG: 1.1, category: 'carbohidrato' },
  { name: 'Avena en hojuelas', kcal: 389, proteinG: 17, carbsG: 66, fatG: 7, category: 'cereal' },
  { name: 'Pan integral', kcal: 247, proteinG: 13, carbsG: 41, fatG: 3.4, category: 'cereal' },
  { name: 'Papa cocida', kcal: 87, proteinG: 2, carbsG: 20, fatG: 0.1, category: 'carbohidrato' },
  { name: 'Batata cocida', kcal: 90, proteinG: 2, carbsG: 21, fatG: 0.1, category: 'carbohidrato' },
  { name: 'Quinoa cocida', kcal: 120, proteinG: 4.4, carbsG: 21, fatG: 1.9, category: 'cereal' },
  { name: 'Banana', kcal: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3, category: 'fruta' },
  { name: 'Manzana', kcal: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2, category: 'fruta' },
  // Grasas
  { name: 'Aceite de oliva', kcal: 884, proteinG: 0, carbsG: 0, fatG: 100, category: 'grasa' },
  { name: 'Aguacate', kcal: 160, proteinG: 2, carbsG: 9, fatG: 15, category: 'fruta' },
  { name: 'Nueces', kcal: 654, proteinG: 15, carbsG: 14, fatG: 65, category: 'grasa' },
  { name: 'Almendras', kcal: 579, proteinG: 21, carbsG: 22, fatG: 50, category: 'grasa' },
  { name: 'Mantequilla de maní', kcal: 588, proteinG: 25, carbsG: 20, fatG: 50, category: 'grasa' },
  // Lácteos
  { name: 'Yogur griego', kcal: 59, proteinG: 10, carbsG: 3.6, fatG: 0.7, category: 'lacteo' },
  { name: 'Leche entera', kcal: 61, proteinG: 3.2, carbsG: 4.8, fatG: 3.3, category: 'lacteo' },
  { name: 'Queso fresco', kcal: 72, proteinG: 12, carbsG: 2.7, fatG: 2, category: 'lacteo' },
  { name: 'Queso parmesano', kcal: 431, proteinG: 38, carbsG: 4, fatG: 29, category: 'lacteo' },
  // Verduras
  { name: 'Brócoli', kcal: 34, proteinG: 2.8, carbsG: 7, fatG: 0.4, category: 'verdura' },
  { name: 'Espinaca', kcal: 23, proteinG: 2.9, carbsG: 3.6, fatG: 0.4, category: 'verdura' },
  { name: 'Tomate', kcal: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2, category: 'verdura' },
  { name: 'Pepino', kcal: 16, proteinG: 0.7, carbsG: 3.6, fatG: 0.1, category: 'verdura' },
  { name: 'Zanahoria', kcal: 41, proteinG: 0.9, carbsG: 10, fatG: 0.2, category: 'verdura' },
  { name: 'Pimiento', kcal: 31, proteinG: 1, carbsG: 6, fatG: 0.3, category: 'verdura' },
  // Bebidas
  { name: 'Café negro', kcal: 2, proteinG: 0.3, carbsG: 0, fatG: 0, category: 'bebida' },
  { name: 'Coca-Cola', kcal: 42, proteinG: 0, carbsG: 11, fatG: 0, category: 'bebida' },
  { name: 'Zumo de naranja', kcal: 45, proteinG: 0.7, carbsG: 10, fatG: 0.2, category: 'bebida' },
  { name: 'Cerveza', kcal: 43, proteinG: 0.5, carbsG: 3.6, fatG: 0, category: 'bebida' },
  // Otros
  { name: 'Miel', kcal: 304, proteinG: 0.3, carbsG: 82, fatG: 0, category: 'otro' },
  { name: 'Chocolate negro 70%', kcal: 598, proteinG: 8, carbsG: 46, fatG: 43, category: 'otro' },
  { name: 'Proteína en polvo', kcal: 375, proteinG: 80, carbsG: 7, fatG: 3, category: 'proteina' },
]

// Calcula totales diarios de un array de comidas.
export const calculateDailyTotals = (meals: MealEntry[]): {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
} => {
  let kcal = 0, proteinG = 0, carbsG = 0, fatG = 0
  for (const meal of meals) {
    for (const item of meal.items) {
      kcal += item.kcal
      proteinG += item.proteinG
      carbsG += item.carbsG
      fatG += item.fatG
    }
  }
  return { kcal, proteinG, carbsG, fatG }
}

// Calcula macros de un alimento según gramos.
export const calculateFoodMacros = (food: FoodItem, grams: number): MealFoodEntry => {
  const factor = grams / 100
  return {
    foodId: food.id,
    foodName: food.name,
    grams,
    kcal: Math.round(food.kcal * factor),
    proteinG: +(food.proteinG * factor).toFixed(1),
    carbsG: +(food.carbsG * factor).toFixed(1),
    fatG: +(food.fatG * factor).toFixed(1),
  }
}
