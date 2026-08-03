import { PagePlaceholder } from '../components/ui/PagePlaceholder'

export const RutinasPage = () => {
  return (
    <PagePlaceholder
      title="Rutinas"
      subtitle="Catálogo por objetivo y nivel"
    >
      <div className="rounded-2xl border border-border bg-bg-elevated p-5">
        <p className="text-sm text-muted">
          Aquí irán PPL, Full-Body, Upper/Lower, 5×5 y más (fase 4).
        </p>
      </div>
    </PagePlaceholder>
  )
}
