// Datos personales que el onboarding dejó en el perfil, listos para precargar
// calculadoras y medidas: edad, altura, sexo y el último peso registrado.
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { bodyWeightRepo } from '@/data/repositories'
import { latestWeightKg } from '@/domain/bodyProfile'
import { BODY_SEX_KEY, HEIGHT_KEY, calculatorSexFromBodySex } from '@/domain/profileMeta'
import type { BodyWeightEntry, Sex } from '@/domain/types'
import { useMetaValue } from './useMetaValue'
import { useProfileAge } from './useProfileAge'

// `weightEntries` permite reutilizar una capa única que ya cargó los pesos
// (Perfil los trae de useAchievementsData) y evita un getAll duplicado.
export const useBodyProfile = (weightEntries?: readonly BodyWeightEntry[]) => {
  const { age } = useProfileAge()
  const storedHeight = useMetaValue<number>(HEIGHT_KEY, 0)
  const bodySex = useMetaValue<Sex | null>(BODY_SEX_KEY, null)
  const queriedWeights = useLiveQuery(
    () => (weightEntries === undefined ? bodyWeightRepo.getAll() : Promise.resolve([])),
    [weightEntries],
  )
  const weights = weightEntries ?? queriedWeights ?? []
  const weightKg = useMemo(() => latestWeightKg(weights), [weights])

  return {
    age,
    heightCm: storedHeight > 0 ? storedHeight : null,
    // `bodySex` conserva la ausencia de dato; `sex` es el default que usan las calculadoras.
    bodySex,
    sex: calculatorSexFromBodySex(bodySex),
    weightKg,
  }
}
