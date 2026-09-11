// Comidas de hoy en vivo (Plan A N1): consulta indexada por localDate
// (mealRepo.getByDate → donde('localDate')) en vez de barrer getAll() en
// memoria. La página de nutrición solo muestra el día actual.
import { useLiveQuery } from 'dexie-react-hooks'
import { mealRepo } from '@/data/repositories'
import { toLocalDateStr } from '@/domain/dates'
import type { MealEntry } from '@/domain/types'

export const useTodayMeals = (): MealEntry[] =>
  useLiveQuery(() => mealRepo.getByDate(toLocalDateStr()), []) ?? []