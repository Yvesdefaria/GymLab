// Paginación incremental «Ver más» (F93 #5 / F120/PH-3): recorta la lista ya ordenada
// por el consumidor a `pageSize` visibles y crece de a una página. Compartida por el
// historial de peso y el timeline de fotos para no montar cientos de nodos de una.
import { useCallback, useMemo, useState } from 'react'

export const usePagedList = <T,>(
  items: T[],
  pageSize: number
): { visible: T[]; hasMore: boolean; showMore: () => void } => {
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const visible = useMemo(() => items.slice(0, visibleCount), [items, visibleCount])
  const hasMore = visibleCount < items.length
  const showMore = useCallback(() => setVisibleCount((count) => count + pageSize), [pageSize])
  return { visible, hasMore, showMore }
}
