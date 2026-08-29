// Metadatos de comidas: tipos y claves i18n tipadas (evita `t()` con claves dinámicas sin cast).
import type { MealType } from '@/domain/types'
import type { I18nKey } from '@/i18n'

export const MEAL_TYPES: MealType[] = ['desayuno', 'almuerzo', 'cena', 'snack']

// Claves i18n del esquema tipado (Ruta dot-path literal, no `string`) para usar en t() sin `as any`.
export const MEAL_TYPE_LABEL_KEY: Record<MealType, I18nKey> = {
  desayuno: 'nutrition.meal.desayuno',
  almuerzo: 'nutrition.meal.almuerzo',
  cena: 'nutrition.meal.cena',
  snack: 'nutrition.meal.snack',
}