// Hook del nombre/alias del perfil: lee y guarda `meta.profileName` (texto plano).
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback } from 'react'
import { metaRepo } from '@/data/repositories'
import { PROFILE_NAME_KEY } from '@/domain/profileMeta'

export const useProfileName = () => {
  const name = useLiveQuery(() => metaRepo.getJson<string>(PROFILE_NAME_KEY, ''), [])

  const setName = useCallback(async (value: string) => {
    await metaRepo.setJson(PROFILE_NAME_KEY, value)
  }, [])

  return { name: name ?? '', setName }
}
