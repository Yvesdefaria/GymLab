import { useLiveQuery } from 'dexie-react-hooks'
import { metaRepo } from '@/data/repositories'

/** Lee un valor JSON de la tabla meta de forma reactiva (los hooks envuelven useLiveQuery). */
export const useMetaValue = <T>(key: string, fallback: T): T =>
  useLiveQuery(() => metaRepo.getJson<T>(key, fallback), [key, fallback]) ?? fallback
