// Hook del avatar de perfil: lee y guarda `meta.avatarUri` (URL HTTPS o dataURL).
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback } from 'react'
import { metaRepo } from '@/data/repositories'

export const AVATAR_META_KEY = 'avatarUri'

export const useAvatar = () => {
  const avatarUri = useLiveQuery(() => metaRepo.getJson<string>(AVATAR_META_KEY, ''), [])

  const setAvatar = useCallback(async (uri: string) => {
    await metaRepo.setJson(AVATAR_META_KEY, uri)
  }, [])

  return { avatarUri: avatarUri ?? '', setAvatar }
}
