import { Link } from 'react-router-dom'
import { Play, Flame, TrendingUp } from 'lucide-react'
import { AppHeader } from '../components/layout/AppHeader'

export const EntrenarPage = () => {
  return (
    <div>
      <AppHeader
        title="Entrenar"
        subtitle="Registra series, reps y peso"
      />
      <div className="space-y-4 p-4">
        <Link
          to="/entrenamiento/nuevo"
          className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-cta px-4 py-3 font-display text-lg font-semibold tracking-wide text-bg transition-opacity hover:opacity-90"
        >
          <Play className="size-5" aria-hidden fill="currentColor" />
          Iniciar entrenamiento
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-bg-elevated p-4">
            <Flame className="mb-2 size-5 text-cta" aria-hidden />
            <p className="text-xs uppercase tracking-wider text-muted">Racha</p>
            <p className="font-display text-2xl font-bold text-accent">—</p>
          </div>
          <div className="rounded-2xl border border-border bg-bg-elevated p-4">
            <TrendingUp className="mb-2 size-5 text-success" aria-hidden />
            <p className="text-xs uppercase tracking-wider text-muted">
              Volumen sem.
            </p>
            <p className="font-display text-2xl font-bold text-accent">—</p>
          </div>
        </div>

        <section className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-4">
          <h2 className="font-display text-lg text-accent">Último entreno</h2>
          <p className="mt-1 text-sm text-muted">
            Aún no hay sesiones. Completa la fase de datos y seguimiento.
          </p>
        </section>
      </div>
    </div>
  )
}
