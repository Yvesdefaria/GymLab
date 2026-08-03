import { Link } from 'react-router-dom'
import {
  User,
  Calculator,
  BookOpen,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { AppHeader } from '../components/layout/AppHeader'

const links = [
  {
    to: '/perfil',
    label: 'Perfil e historial',
    description: 'PRs, rachas y volumen',
    icon: User,
  },
  {
    to: '/calculadoras',
    label: 'Calculadoras',
    description: 'IMC, calorías y más',
    icon: Calculator,
  },
  {
    to: '/ejercicios',
    label: 'Biblioteca de ejercicios',
    description: 'Técnica y grupos musculares',
    icon: BookOpen,
  },
] as const

export const MasPage = () => {
  return (
    <div>
      <AppHeader title="Más" subtitle="Perfil, herramientas y ajustes" />
      <div className="space-y-2 p-4">
        {links.map(({ to, label, description, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex min-h-[56px] items-center gap-3 rounded-2xl border border-border bg-bg-elevated px-4 py-3 transition-colors hover:border-accent/40"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-bg text-accent">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-fg">{label}</span>
              <span className="block text-sm text-muted">{description}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
          </Link>
        ))}

        <div className="mt-6 flex items-start gap-2 rounded-xl border border-border/60 bg-bg-elevated/40 p-3 text-xs text-muted">
          <Shield className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p>
            Datos guardados en este dispositivo (local-first). Las cuentas en la
            nube llegarán en una fase posterior.
          </p>
        </div>
      </div>
    </div>
  )
}
