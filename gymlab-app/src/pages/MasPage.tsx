// Página /mas: hub «Más» con accesos a perfil, herramientas, biblioteca y ajustes.
// Es un índice de navegación: cada entrada es un enlace a una sección de la app.
// Admite dos vistas (grip/lista) que se persisten en ajustes.
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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

// Catálogo estático de accesos del hub: ruta, claves de etiqueta/descripción e icono.
const links = [
  {
    to: '/perfil',
    labelKey: 'mas.linkPerfil',
    descKey: 'mas.linkPerfilDesc',
    icon: User,
  },
  {
    to: '/peso-corporal',
    labelKey: 'mas.linkPesoCorporal',
    descKey: 'mas.linkPesoCorporalDesc',
    icon: Scale,
  },
  {
    to: '/calendario',
    labelKey: 'mas.linkCalendario',
    descKey: 'mas.linkCalendarioDesc',
    icon: CalendarDays,
  },
  {
    to: '/cuerpo',
    labelKey: 'mas.linkCuerpo',
    descKey: 'mas.linkCuerpoDesc',
    icon: Activity,
  },
  {
    to: '/guias',
    labelKey: 'mas.linkGuias',
    descKey: 'mas.linkGuiasDesc',
    icon: BookMarked,
  },
  {
    to: '/calculadoras',
    labelKey: 'mas.linkCalculadoras',
    descKey: 'mas.linkCalculadorasDesc',
    icon: Calculator,
  },
  {
    to: '/ejercicios',
    labelKey: 'mas.linkBiblioteca',
    descKey: 'mas.linkBibliotecaDesc',
    icon: BookOpen,
  },
  {
    to: '/ajustes',
    labelKey: 'mas.linkAjustes',
    descKey: 'mas.linkAjustesDesc',
    icon: Settings,
  },
] as const

export const MasPage = () => {
  const { t } = useTranslation()
  const { settings, update } = useSettings()
  const isGrip = settings.hubLayout === 'grip'

  const setLayout = (hubLayout: 'grip' | 'list') => void update({ hubLayout })

  return (
    <div>
      <AppHeader title={t('mas.titulo')} subtitle={t('mas.subtitulo')} />
      <div className="space-y-2 p-4">
        {/* Alternancia de vista: rejilla compacta o lista con descripción. */}
        <div className="flex items-center justify-between">
          <span className="sr-only" id="hub-view-label">{t('mas.vistaHub')}</span>
          <div
            className="ml-auto inline-flex rounded-xl border border-border bg-bg-elevated p-1"
            role="group"
            aria-labelledby="hub-view-label"
          >
            <button
              type="button"
              onClick={() => setLayout('grip')}
              aria-pressed={isGrip}
              aria-label={t('mas.vistaRejilla')}
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
              aria-label={t('mas.vistaLista')}
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
            {links.map(({ to, labelKey, icon: Icon }, i) => (
              <Link
                key={to}
                to={to}
                className={`stagger-fade stagger-fade-${Math.min(i + 1, 8)} flex flex-col items-center gap-2 rounded-2xl border-b border-border/30 px-2 py-4 text-center transition-colors hover:border-gold/70`}
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-bg-elevated text-accent">
                  <Icon className="size-6" aria-hidden />
                </span>
                <span className="block text-sm font-medium leading-tight text-fg">{t(labelKey)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div>
            {links.map(({ to, labelKey, descKey, icon: Icon }, i) => (
              <Link
                key={to}
                to={to}
                className={`stagger-fade stagger-fade-${Math.min(i + 1, 8)} flex min-h-[56px] items-center gap-3 panel-flush rounded-xl border-b border-border/30 px-4 py-3 transition-colors hover:border-gold/80`}
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-bg-elevated text-accent">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-fg">{t(labelKey)}</span>
                  <span className="block text-sm text-muted">{t(descKey)}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-start gap-2 panel-light rounded-xl p-3 text-xs text-muted">
          <Shield className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p>{t('mas.datosLocalFirst')}</p>
        </div>

        <div className="flex items-start gap-2 panel-light rounded-xl p-3 text-xs text-muted">
          <Image className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p>
            {t('mas.fotosEjerciciosPre')} <span className="text-fg/80">free-exercise-db</span>{' '}
            {t('mas.fotosEjerciciosPost')}
          </p>
        </div>
      </div>
    </div>
  )
}
