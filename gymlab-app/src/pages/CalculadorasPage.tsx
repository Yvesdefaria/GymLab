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
import { useTranslation } from 'react-i18next'
import { AppHeader } from '../components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { PlateCalculatorModal } from '@/components/workout/PlateCalculatorModal'
import { useState } from 'react'

// Catálogo de calculadoras disponibles; cada entrada enlaza a su ruta bajo /calculadoras.
// Las etiquetas se resuelven con t() dentro del componente (claves de i18n).
const ready = [
  {
    to: '/calculadoras/imc',
    labelKey: 'calculadoras.hub.imc',
    descriptionKey: 'calculadoras.hub.imcDesc',
    icon: Activity,
  },
  {
    to: '/calculadoras/calorias',
    labelKey: 'calculadoras.hub.calorias',
    descriptionKey: 'calculadoras.hub.caloriasDesc',
    icon: Flame,
  },
  {
    to: '/calculadoras/macros',
    labelKey: 'calculadoras.hub.macros',
    descriptionKey: 'calculadoras.hub.macrosDesc',
    icon: UtensilsCrossed,
  },
  {
    to: '/calculadoras/1rm',
    labelKey: 'calculadoras.hub.unoRm',
    descriptionKey: 'calculadoras.hub.unoRmDesc',
    icon: Trophy,
  },
  {
    to: '/calculadoras/agua',
    labelKey: 'calculadoras.hub.agua',
    descriptionKey: 'calculadoras.hub.aguaDesc',
    icon: Droplets,
  },
  {
    to: '/calculadoras/conversor',
    labelKey: 'calculadoras.hub.conversor',
    descriptionKey: 'calculadoras.hub.conversorDesc',
    icon: ArrowRightLeft,
  },
  {
    to: '/calculadoras/medidas',
    labelKey: 'calculadoras.hub.medidas',
    descriptionKey: 'calculadoras.hub.medidasDesc',
    icon: Ruler,
  },
  {
    to: '/calculadoras/grasa',
    labelKey: 'calculadoras.hub.grasa',
    descriptionKey: 'calculadoras.hub.grasaDesc',
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
  const { t } = useTranslation()
  const [showPlates, setShowPlates] = useState(false)
  const [query, setQuery] = useState('')
  const [recents, setRecents] = useState<string[]>(getRecents)

  // Catálogo con las etiquetas traducidas según el idioma activo.
  const catalog = ready.map((c) => ({
    to: c.to,
    label: t(c.labelKey),
    description: t(c.descriptionKey),
    icon: c.icon,
  }))

  // Filtro por nombre o descripción (case-insensitive) sobre el catálogo.
  const q = query.trim().toLowerCase()
  const filtered = catalog.filter(
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
        title={t('calculadoras.hub.titulo')}
        subtitle={t('calculadoras.hub.subtitulo')}
      />
      <div className="space-y-4 p-4">
        <BackLink to="/mas" />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('calculadoras.hub.buscarPlaceholder')}
            aria-label={t('calculadoras.hub.buscarAria')}
            className="h-11 w-full rounded-xl border border-border bg-bg-elevated pl-9 pr-9 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('calculadoras.hub.limpiarAria')}
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
              {t('calculadoras.hub.recientes')}
            </p>
            <div className="flex flex-wrap gap-2">
              {recents.map((to) => {
                const item = catalog.find((c) => c.to === to)
                if (!item) return null
                const Icon = item.icon
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => handleOpen(to)}
                    className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3 text-xs text-fg transition-colors hover:border-cta"
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
                  <span className="block font-medium text-fg">{t('calculadoras.hub.discosTitulo')}</span>
                  <span className="block text-sm text-muted">
                    {t('calculadoras.hub.discosDesc')}
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
            {t('calculadoras.hub.sinResultados', { query })}
          </p>
        )}

        <p className="text-center text-xs text-muted">
          {t('calculadoras.hub.disclaimer')}
        </p>
      </div>

      {showPlates && (
        <PlateCalculatorModal onClose={() => setShowPlates(false)} />
      )}
    </div>
  )
}
