import { useLiveQuery } from 'dexie-react-hooks'
import { paperRepo } from '@/data/repositories'

export const usePapers = () => {
  const papers = useLiveQuery(() => paperRepo.getAll(), []) ?? []
  return { papers }
}

export const usePaperBySlug = (slug: string | undefined) => {
  const paper = useLiveQuery(
    () => (slug ? paperRepo.getBySlug(slug) : undefined),
    [slug]
  )
  return { paper }
}
