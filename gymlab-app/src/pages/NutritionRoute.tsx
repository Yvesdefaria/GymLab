import { useMemo } from 'react'
import { useMeals } from '@/hooks/useMeals'
import { useProfileAge } from '@/hooks/useProfileAge'
import { useBodyWeight } from '@/hooks/useBodyWeight'
import { useMetaValue } from '@/hooks/useMetaValue'
import { useLiveList } from '@/hooks/useLiveList'
import { HEIGHT_KEY, BODY_SEX_KEY } from '@/domain/profileMeta'
import { calcTDEE } from '@/domain/calculators/tdee'
import { adjustTdeeForSteps } from '@/domain/nutrition'
import { toLocalDateStr } from '@/domain/dates'
import { stepRepo } from '@/data/repositories'
import { NutritionPage } from './NutritionPage'

export const NutritionRoute = () => {
  const { meals, mealRepo } = useMeals()
  const { age } = useProfileAge()
  const { today: weightEntry } = useBodyWeight()
  const heightCm = useMetaValue<number>(HEIGHT_KEY, 0)
  const bodySex = useMetaValue<string>(BODY_SEX_KEY, 'male')

  // Pasos de hoy (F84e): alimentan el ajuste calórico por actividad.
  const stepEntries = useLiveList(() => stepRepo.getAll())
  const todaySteps = stepEntries.find((e) => e.localDate === toLocalDateStr())?.steps ?? 0

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