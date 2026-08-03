import { Link } from 'react-router-dom'
import { Activity, Flame, ChevronRight, Construction } from 'lucide-react'
import { AppHeader } from '../components/layout/AppHeader'

const ready = [
  {
    to: '/calculadoras/imc',
    label: 'IMC',
    description: 'Índice de masa corporal (OMS)',
    icon: Activity,
  },
  {
    to: '/calculadoras/calorias',
    label: 'Calorías (TDEE)',
    description: 'Gasto energético y rangos',
    icon: Flame,
  },
] as const

const upcoming = [
  '1RM (fuerza máxima estimada)',
  'Macros por objetivo',
  'Agua diaria',
  '% grasa corporal',
  'Conversor lb ↔ kg',
] as const

export const CalculadorasPage = () => {
  return (
    <div>
      <AppHeader
        title="Calculadoras"
        subtitle="Herramientas rápidas de fitness"
      />
      <div className="space-y-4 p-4">
        <ul className="space-y-2">
          {ready.map(({ to, label, description, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex min-h-[56px] items-center gap-3 rounded-2xl border border-border bg-bg-elevated px-4 py-3 transition-colors hover:border-cta/50"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-bg text-cta">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-fg">{label}</span>
                  <span className="block text-sm text-muted">
                    {description}
                  </span>
                </span>
                <ChevronRight
                  className="size-5 shrink-0 text-muted"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>

        <section className="rounded-2xl border border-dashed border-border p-4">
          <div className="mb-2 flex items-center gap-2 text-accent">
            <Construction className="size-4" aria-hidden />
            <h2 className="font-display text-base tracking-wide">Próximamente</h2>
          </div>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted">
            {upcoming.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <p className="text-center text-xs text-muted">
          Resultados informativos. No sustituyen consejo médico profesional.
        </p>
      </div>
    </div>
  )
}
