// Hooks que consultan las guías informativas de GymLab.
import { useLiveQuery } from 'dexie-react-hooks'
import { useLiveList } from './useLiveList'
import { guideRepo } from '@/data/repositories'

// Devuelve todas las guías disponibles para listarlas en el hub.
export const useGuides = () => {
  const guides = useLiveList(() => guideRepo.getAll())
  return { guides }
}

// Busca una guía por su slug para mostrar su detalle.
export const useGuideBySlug = (slug: string | undefined) => {
  const guide = useLiveQuery(
    () => (slug ? guideRepo.getBySlug(slug) : undefined),
    [slug]
  )
  return { guide }
}
