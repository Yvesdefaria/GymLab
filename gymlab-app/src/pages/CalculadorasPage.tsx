import { Link } from 'react-router-dom'
import {
  Activity,
  Flame,
  ChevronRight,
  Trophy,
  Droplets,
  ArrowRightLeft,
  UtensilsCrossed,
  Scale,
} from 'lucide-react'
import { AppHeader } from '../components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { PlateCalculatorModal } from '@/components/workout/PlateCalculatorModal'
import { useState } from 'react'

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
    to: '/calculadoras/macros',
    label: 'Macros',
    description: 'TDEE y proteína, carbos, grasas',
    icon: UtensilsCrossed,
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
  const [showPlates, setShowPlates] = useState(false)

  return (
    <div>
      <AppHeader
        title="Calculadoras"
        subtitle="Herramientas rápidas de fitness"
      />
      <div className="space-y-4 p-4">
        <BackLink to="/mas" />
        <ul className="grid grid-cols-2 gap-3">
          {ready.map(({ to, label, description, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex h-[128px] flex-col items-center justify-center gap-2 panel rounded-2xl px-3 py-4 text-center transition-colors hover:border-gold/80"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-bg text-cta">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-medium text-fg">{label}</span>
                  <span className="mt-0.5 block line-clamp-2 text-xs text-muted">{description}</span>
                </span>
              </Link>
            </li>
          ))}
          <li className="col-span-2">
            <button
              onClick={() => setShowPlates(true)}
              className="flex min-h-[56px] w-full items-center gap-3 panel rounded-2xl px-4 py-3 text-left transition-colors hover:border-gold/80"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-bg text-cta">
                <Scale className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-fg">Calculadora de discos</span>
                <span className="block text-sm text-muted">
                  Discos por lado para una carga
                </span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-muted"
                aria-hidden
              />
            </button>
          </li>
        </ul>

        <p className="text-center text-xs text-muted">
          Resultados informativos. No sustituyen consejo médico profesional.
        </p>
      </div>

      {showPlates && (
        <PlateCalculatorModal onClose={() => setShowPlates(false)} />
      )}
    </div>
  )
}
