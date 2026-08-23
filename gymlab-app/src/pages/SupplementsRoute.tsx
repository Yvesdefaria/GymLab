import { useSupplements } from '@/hooks/useSupplements'
import { SupplementsPage } from './SupplementsPage'

export const SupplementsRoute = () => {
  const { supplements, supplementRepo } = useSupplements()
  return (
    <SupplementsPage
      supplements={supplements}
      onAdd={(s) => supplementRepo.add(s)}
      onDelete={(id) => supplementRepo.delete(id)}
    />
  )
}
