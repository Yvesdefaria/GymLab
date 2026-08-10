// Página /mas: hub «Más» con accesos a perfil, herramientas, biblioteca y ajustes.
// Es un índice de navegación: cada entrada es un enlace a una sección de la app.
// Admite dos vistas (grip/lista) que se persisten en ajustes.
import { Link } from 'react-router-dom'
import {
  User,
  Calculator,
  BookOpen,
  ChevronRight,
  Shield,
  BookMarked,
  Activity,
  CalendarDays,
  Image,
  Settings,
  Scale,
  LayoutGrid,
  List,
} from 'lucide-react'
import { AppHeader } from '../components/layout/AppHeader'
import { useSettings } from '@/hooks/useSettings'

// Catálogo estático de accesos del hub: ruta, etiqueta, descripción e icono.
const links = [
  {
    to: '/perfil',
    label: 'Perfil e historial',
    description: 'PRs, rachas y volumen',
    icon: User,
  },
  {
    to: '/peso-corporal',
    label: 'Peso corporal',
    description: 'Registro diario y evolución en gráfico',
    icon: Scale,
  },
  {
    to: '/calendario',
    label: 'Calendario',
    description: 'Días entrenados y programados',
    icon: CalendarDays,
  },
  {
    to: '/cuerpo',
    label: 'Cuerpo y fatiga',
    description: 'Mapa muscular interactivo',
    icon: Activity,
  },
  {
    to: '/guias',
    label: 'Guías',
    description: 'Nutrición, macros y recuperación',
    icon: BookMarked,
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
  {
    to: '/ajustes',
    label: 'Ajustes',
    description: 'Modo noche y día, unidades',
    icon: Settings,
  },
] as const

export const MasPage = () => {
  const { settings, update } = useSettings()
  const isGrip = settings.hubLayout === 'grip'

  const setLayout = (hubLayout: 'grip' | 'list') => void update({ hubLayout })

  return (
    <div>
      <AppHeader title="Más" subtitle="Perfil, herramientas y ajustes" />
      <div className="space-y-2 p-4">
        {/* Alternancia de vista: rejilla compacta o lista con descripción. */}
        <div className="flex items-center justify-between">
          <span className="sr-only" id="hub-view-label">Vista del hub</span>
          <div
            className="ml-auto inline-flex rounded-xl border border-border bg-bg-elevated p-1"
            role="group"
            aria-labelledby="hub-view-label"
          >
            <button
              type="button"
              onClick={() => setLayout('grip')}
              aria-pressed={isGrip}
              aria-label="Vista de rejilla"
              className="flex size-11 items-center justify-center rounded-lg transition-colors"
            >
              <span className={`flex size-10 items-center justify-center rounded-md ${isGrip ? 'bg-cta/20 text-cta' : 'text-muted'}`}>
                <LayoutGrid className="size-5" aria-hidden />
              </span>
            </button>
            <button
              type="button"
              onClick={() => setLayout('list')}
              aria-pressed={!isGrip}
              aria-label="Vista de lista"
              className="flex size-11 items-center justify-center rounded-lg transition-colors"
            >
              <span className={`flex size-10 items-center justify-center rounded-md ${!isGrip ? 'bg-cta/20 text-cta' : 'text-muted'}`}>
                <List className="size-5" aria-hidden />
              </span>
            </button>
          </div>
        </div>

        {isGrip ? (
          <div className="grid grid-cols-2 gap-3">
            {links.map(({ to, label, icon: Icon }, i) => (
              <Link
                key={to}
                to={to}
                className={`stagger-fade stagger-fade-${Math.min(i + 1, 8)} flex flex-col items-center gap-2 rounded-2xl border border-border/80 bg-bg-elevated px-2 py-4 text-center transition-colors hover:border-gold/70`}
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-bg text-accent">
                  <Icon className="size-6" aria-hidden />
                </span>
                <span className="block text-sm font-medium leading-tight text-fg">{label}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div>
            {links.map(({ to, label, description, icon: Icon }, i) => (
              <Link
                key={to}
                to={to}
                className={`stagger-fade stagger-fade-${Math.min(i + 1, 8)} flex min-h-[56px] items-center gap-3 panel rounded-2xl px-4 py-3 transition-colors hover:border-gold/80`}
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
          </div>
        )}

        <div className="mt-6 flex items-start gap-2 rounded-xl border border-border/60 bg-bg-elevated/40 p-3 text-xs text-muted">
          <Shield className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p>
            Datos guardados en este dispositivo (local-first). Las cuentas en la
            nube llegarán en una fase posterior.
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-bg-elevated/40 p-3 text-xs text-muted">
          <Image className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p>
            Fotos de ejercicios: <span className="text-fg/80">free-exercise-db</span>{' '}
            (dominio público, Unlicense). Disponibles para uso comercial sin
            atribución obligatoria.
          </p>
        </div>
      </div>
    </div>
  )
}
