import { PagePlaceholder } from '../components/ui/PagePlaceholder'

export const PerfilPage = () => {
  return (
    <PagePlaceholder
      title="Perfil"
      subtitle="Historial, PRs y progreso"
    >
      <div className="rounded-2xl border border-border bg-bg-elevated p-5">
        <p className="text-sm text-muted">
          Racha, mejores marcas y gráfico de volumen (fase 6).
        </p>
      </div>
    </PagePlaceholder>
  )
}
