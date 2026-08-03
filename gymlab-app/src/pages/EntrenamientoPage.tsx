import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AppHeader } from '../components/layout/AppHeader'

export const EntrenamientoPage = () => {
  return (
    <div>
      <AppHeader title="Sesión" subtitle="Seguimiento en vivo" />
      <div className="space-y-4 p-4">
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver
        </Link>
        <div className="rounded-2xl border border-border bg-bg-elevated p-5">
          <p className="text-sm text-muted">
            Aquí irán series, reps, peso y cronómetro de descanso (fase 3).
          </p>
        </div>
      </div>
    </div>
  )
}
