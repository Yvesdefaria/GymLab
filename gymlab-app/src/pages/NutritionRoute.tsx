import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTodayMeals } from '@/hooks/useTodayMeals'
import { useProfileAge } from '@/hooks/useProfileAge'
import { useMetaValue } from '@/hooks/useMetaValue'
import { useTodayStepEntry } from '@/hooks/useTodayStepEntry'
import { mealRepo, bodyWeightRepo } from '@/data/repositories'
import { toLocalDateStr } from '@/domain/dates'
import { HEIGHT_KEY, BODY_SEX_KEY } from '@/domain/profileMeta'
import { calcTDEE } from '@/domain/calculators/tdee'
import { adjustTdeeForSteps } from '@/domain/nutrition'
import { NutritionPage } from './NutritionPage'

export const NutritionRoute = () => {
  const meals = useTodayMeals()
  const { age } = useProfileAge()
  // Peso de hoy en vivo: consulta indexada por localDate (bodyWeightRepo.getByDate)
  // en vez de barrer getAll() en memoria; el TDEE solo consume el día actual.
  const weightEntry = useLiveQuery(() => bodyWeightRepo.getByDate(toLocalDateStr()), [])
  const heightCm = useMetaValue<number>(HEIGHT_KEY, 0)
  const bodySex = useMetaValue<string>(BODY_SEX_KEY, 'male')

  // Pasos de hoy (F84e): alimentan el ajuste calórico por actividad.
  const todaySteps = useTodayStepEntry()?.steps ?? 0

  // Mapear sex de ('male'|'female') → ('hombre'|'mujer') para calcTDEE
  const sexo = bodySex === 'female' ? 'mujer' : 'hombre'

  const tdee = useMemo(() => {
    if (!age || !heightCm || !weightEntry) return undefined
    // TDEE basal con factor de actividad fijo 'moderado'; el gasto por pasos de
    // hoy se suma aparte (F84e): TDEE + pasos × 0.04 (sin pasos → +0).
    const base = calcTDEE(weightEntry.weightKg, heightCm, age, sexo, 'moderado')
    return adjustTdeeForSteps(base, todaySteps)
  }, [age, heightCm, weightEntry, sexo, todaySteps])

  return (
    <NutritionPage
      meals={meals}
      onAddMeal={(meal) => mealRepo.add(meal)}
      onDeleteMeal={(id) => mealRepo.delete(id)}
      tdee={tdee}
    />
  )
}