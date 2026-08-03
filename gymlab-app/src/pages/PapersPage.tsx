import { PagePlaceholder } from '../components/ui/PagePlaceholder'

export const PapersPage = () => {
  return (
    <PagePlaceholder
      title="Papers"
      subtitle="Resúmenes con fuente oficial"
    >
      <div className="rounded-2xl border border-border bg-bg-elevated p-5">
        <p className="text-sm text-muted">
          Resúmenes de estudios con enlace DOI/PubMed (fase 5).
        </p>
      </div>
    </PagePlaceholder>
  )
}
