import { useLiveQuery } from 'dexie-react-hooks'
import { guideRepo } from '@/data/repositories'

export const useGuides = () => {
  const guides = useLiveQuery(() => guideRepo.getAll(), []) ?? []
  return { guides }
}

export const useGuideBySlug = (slug: string | undefined) => {
  const guide = useLiveQuery(
    () => (slug ? guideRepo.getBySlug(slug) : undefined),
    [slug]
  )
  return { guide }
}
