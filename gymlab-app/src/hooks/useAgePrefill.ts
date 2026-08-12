import { useEffect } from 'react'
import { useProfileAge } from './useProfileAge'

// Pre-rellena la edad de una calculadora desde el perfil solo cuando no hay
// valor guardado (o editado) en esa página, para no pisar lo que el usuario teclea.
export const useAgePrefill = (
  age: string,
  setAge: (value: string) => void,
  hasStoredValue: boolean = false,
) => {
  const { age: profileAge } = useProfileAge()
  useEffect(() => {
    if (hasStoredValue || age !== '' || profileAge == null) return
    setAge(String(profileAge))
  }, [hasStoredValue, age, profileAge, setAge])
}
