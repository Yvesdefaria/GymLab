// Hook que consulta el perfil del usuario de forma reactiva.
import { useLiveQuery } from 'dexie-react-hooks'
import { profileRepo } from '@/data/repositories'

// Devuelve el perfil guardado (datos personales y objetivos) o undefined si aún no existe.
export const useProfile = () => {
  return useLiveQuery(() => profileRepo.get(), []) ?? undefined
}
