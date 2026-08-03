import { PagePlaceholder } from '../components/ui/PagePlaceholder'

export const EjerciciosPage = () => {
  return (
    <PagePlaceholder
      title="Ejercicios"
      subtitle="Biblioteca con técnica"
    >
      <div className="rounded-2xl border border-border bg-bg-elevated p-5">
        <p className="text-sm text-muted">
          Catálogo de ejercicios del seed (fase 6).
        </p>
      </div>
    </PagePlaceholder>
  )
}
