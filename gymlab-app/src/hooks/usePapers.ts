// Hooks que consultan la biblioteca de papers de fitness.
import { useLiveQuery } from 'dexie-react-hooks'
import { paperRepo } from '@/data/repositories'

// Devuelve todos los papers para listarlos en el catálogo.
export const usePapers = () => {
  const papers = useLiveQuery(() => paperRepo.getAll(), []) ?? []
  return { papers }
}

// Busca un paper por su slug para mostrar su ficha.
export const usePaperBySlug = (slug: string | undefined) => {
  const paper = useLiveQuery(
    () => (slug ? paperRepo.getBySlug(slug) : undefined),
    [slug]
  )
  return { paper }
}
