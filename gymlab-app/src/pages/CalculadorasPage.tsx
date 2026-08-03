import { Link } from 'react-router-dom'
import {
  Activity,
  Flame,
  ChevronRight,
  Trophy,
  Droplets,
  ArrowRightLeft,
} from 'lucide-react'
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
  {
    to: '/calculadoras/1rm',
    label: '1RM',
    description: 'Fuerza máxima estimada',
    icon: Trophy,
  },
  {
    to: '/calculadoras/agua',
    label: 'Agua diaria',
    description: 'Hidratación recomendada',
    icon: Droplets,
  },
  {
    to: '/calculadoras/conversor',
    label: 'Conversor lb ↔ kg',
    description: 'Peso de discos y ejercicios',
    icon: ArrowRightLeft,
  },
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
                className="flex min-h-[56px] items-center gap-3 rounded-2xl border border-gold/40 bg-bg-elevated px-4 py-3 transition-colors hover:border-gold/80"
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

        <p className="text-center text-xs text-muted">
          Resultados informativos. No sustituyen consejo médico profesional.
        </p>
      </div>
    </div>
  )
}
