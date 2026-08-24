import { useMemo } from 'react'
import { useMeals } from '@/hooks/useMeals'
import { useProfileAge } from '@/hooks/useProfileAge'
import { useBodyWeight } from '@/hooks/useBodyWeight'
import { useMetaValue } from '@/hooks/useMetaValue'
import { HEIGHT_KEY, BODY_SEX_KEY } from '@/domain/profileMeta'
import { calcTDEE } from '@/domain/calculators/tdee'
import { NutritionPage } from './NutritionPage'

export const NutritionRoute = () => {
  const { meals, mealRepo } = useMeals()
  const { age } = useProfileAge()
  const { today: weightEntry } = useBodyWeight()
  const heightCm = useMetaValue<number>(HEIGHT_KEY, 0)
  const bodySex = useMetaValue<string>(BODY_SEX_KEY, 'male')

  // Mapear sex de ('male'|'female') → ('hombre'|'mujer') para calcTDEE
  const sexo = bodySex === 'female' ? 'mujer' : 'hombre'

  const tdee = useMemo(() => {
    if (!age || !heightCm || !weightEntry) return undefined
    return calcTDEE(weightEntry.weightKg, heightCm, age, sexo, 'moderado')
  }, [age, heightCm, weightEntry, sexo])

  return (
    <NutritionPage
      meals={meals}
      onAddMeal={(meal) => mealRepo.add(meal)}
      onDeleteMeal={(id) => mealRepo.delete(id)}
      tdee={tdee}
    />
  )
}
