// Hook del nombre/alias del perfil: lee y guarda `meta.name` (texto plano).
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback } from 'react'
import { metaRepo } from '@/data/repositories'

export const PROFILE_NAME_META_KEY = 'profileName'

export const useProfileName = () => {
  const name = useLiveQuery(() => metaRepo.getJson<string>(PROFILE_NAME_META_KEY, ''), [])

  const setName = useCallback(async (value: string) => {
    await metaRepo.setJson(PROFILE_NAME_META_KEY, value)
  }, [])

  return { name: name ?? '', setName }
}
