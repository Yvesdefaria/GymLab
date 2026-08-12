// Edad calculada desde meta.birthDate (guardada por el onboarding) para
// pre-rellenar las calculadoras sin obligar al usuario a repetirla.
import { ageFromBirthDate, isBirthDateValid } from '@/domain/onboarding'
import { BIRTH_DATE_KEY } from '@/domain/profileMeta'
import { useMetaValue } from './useMetaValue'

export const useProfileAge = () => {
  const birthDate = useMetaValue<string>(BIRTH_DATE_KEY, '')
  const valid = isBirthDateValid(birthDate)
  return { age: valid ? ageFromBirthDate(birthDate) : null, isBirthDateValid: valid }
}
