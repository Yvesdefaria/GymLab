import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTodayMeals } from '@/hooks/useTodayMeals'
import { useProfileAge } from '@/hooks/useProfileAge'
import { useMetaValue } from '@/hooks/useMetaValue'
import { mealRepo, bodyWeightRepo } from '@/data/repositories'
import { toLocalDateStr } from '@/domain/dates'
import { HEIGHT_KEY, BODY_SEX_KEY } from '@/domain/profileMeta'
import { calcTDEE } from '@/domain/calculators/tdee'
import { NutritionPage } from './NutritionPage'

export const NutritionRoute = () => {
  const meals = useTodayMeals()
  const { age } = useProfileAge()
  // Peso de hoy en vivo: consulta indexada por localDate (bodyWeightRepo.getByDate)
  // en vez de barrer getAll() en memoria; el TDEE solo consume el día actual.
  const weightEntry = useLiveQuery(() => bodyWeightRepo.getByDate(toLocalDateStr()), [])
  const heightCm = useMetaValue<number>(HEIGHT_KEY, 0)
  const bodySex = useMetaValue<string>(BODY_SEX_KEY, 'male')

  // Mapear sex de ('male'|'female') → ('hombre'|'mujer') para calcTDEE
  const sexo = bodySex === 'female' ? 'mujer' : 'hombre'

  const tdee = useMemo(() => {
    if (!age || !heightCm || !weightEntry) return undefined
    // TDEE con factor moderado: los pasos no se suman aparte para no duplicar el
    // gasto que el factor de actividad ya incluye (H15).
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