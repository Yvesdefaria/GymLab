// Página hub «Calculadoras» (/calculadoras): catálogo con búsqueda, recientes en
// localStorage y acceso al modal de discos (PlateCalculatorModal).
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
  Search,
  X,
  Clock,
  Ruler,
  Percent,
} from 'lucide-react'
import { AppHeader } from '../components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { PlateCalculatorModal } from '@/components/workout/PlateCalculatorModal'
import { useState } from 'react'

// Catálogo de calculadoras disponibles; cada entrada enlaza a su ruta bajo /calculadoras.
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
  {
    to: '/calculadoras/medidas',
    label: 'Medidas corporales',
    description: 'Cuello, bíceps, cintura… y ratios por zona',
    icon: Ruler,
  },
  {
    to: '/calculadoras/grasa',
    label: 'Grasa corporal',
    description: 'Porcentaje de grasa con pliegues (picómetro)',
    icon: Percent,
  },
] as const

// Recientes: se persisten en localStorage (máx. 3) para recordar las últimas usadas.
const RECENTS_KEY = 'gymlab.recentCalculators'
const MAX_RECENTS = 3

const getRecents = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    const arr = raw ? (JSON.parse(raw) as string[]) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

// Inserta la ruta al frente y descarta duplicados/sobrantes (cabeza de lista).
const pushRecent = (to: string) => {
  const next = [to, ...getRecents().filter((t) => t !== to)].slice(0, MAX_RECENTS)
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
  } catch {
    // noop
  }
}

// Hub de calculadoras: filtra por texto y registra en «Recientes» cada apertura.
export const CalculadorasPage = () => {
  const [showPlates, setShowPlates] = useState(false)
  const [query, setQuery] = useState('')
  const [recents, setRecents] = useState<string[]>(getRecents)

  // Filtro por nombre o descripción (case-insensitive) sobre el catálogo.
  const q = query.trim().toLowerCase()
  const filtered = ready.filter(
    (c) => !q || c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
  )

  // Al abrir una calculadora la marca como reciente y refresca la lista mostrada.
  const handleOpen = (to: string) => {
    pushRecent(to)
    setRecents(getRecents())
  }

  return (
    <div>
      <AppHeader
        title="Calculadoras"
        subtitle="Herramientas rápidas de fitness"
      />
      <div className="space-y-4 p-4">
        <BackLink to="/mas" />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar calculadora..."
            aria-label="Buscar calculadora"
            className="h-11 w-full rounded-xl border border-border bg-bg-elevated pl-9 pr-9 text-sm text-fg placeholder:text-muted/70 focus:border-cta focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-fg"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>

        {recents.length > 0 && !q && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <Clock className="size-3.5" aria-hidden />
              Recientes
            </p>
            <div className="flex flex-wrap gap-2">
              {recents.map((to) => {
                const item = ready.find((c) => c.to === to)
                if (!item) return null
                const Icon = item.icon
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => handleOpen(to)}
                    className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3 text-xs text-fg transition-colors hover:border-cta"
                  >
                    <Icon className="size-3.5 text-cta" aria-hidden />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <ul className="grid grid-cols-2 gap-3">
          {filtered.map(({ to, label, description, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                onClick={() => handleOpen(to)}
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
          {!q && (
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
          )}
        </ul>

        {q && filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-6 text-center text-sm text-muted">
            No hay calculadoras que coincidan con «{query}».
          </p>
        )}

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
