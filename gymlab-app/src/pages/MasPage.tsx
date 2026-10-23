// Página /mas: hub «Más» con bloque de cuenta y un índice agrupado por dominio.
// Una sola vista (sin toggle rejilla/lista): secciones con hairline en vez de tarjetas.
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  BookMarked,
  BookOpen,
  Calculator,
  CalendarDays,
  Camera,
  ChevronRight,
  Droplets,
  Footprints,
  Pill,
  Ruler,
  Scale,
  Settings,
  Target,
  Timer,
  Trophy,
  User,
  UtensilsCrossed,
  Watch,
  type LucideIcon,
} from 'lucide-react'
import { AppHeader } from '../components/layout/AppHeader'
import { useProfileName } from '@/hooks/useProfileName'
import { useAvatar } from '@/hooks/useAvatar'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { usePeriodization } from '@/hooks/usePeriodization'
import { calculateTotalWeeks, getCurrentWeek, type PeriodizationPlan } from '@/domain/periodization'

// Claves de etiqueta: se reutilizan las de la pantalla dueña cuando existe
// (goals, timer, calculadoras) para que el nombre no derive entre superficies.
type LabelKey =
  | 'mas.linkCalendario'
  | 'mas.linkPasos'
  | 'mas.linkLogros'
  | 'mas.linkWearables'
  | 'goals.title'
  | 'timer.title'
  | 'mas.linkPesoCorporal'
  | 'mas.linkCuerpo'
  | 'calculadoras.hub.medidas'
  | 'mas.linkFotosProgreso'
  | 'mas.linkNutricion'
  | 'mas.linkSuplementos'
  | 'calculadoras.hub.agua'
  | 'mas.linkBiblioteca'
  | 'mas.linkGuias'
  | 'mas.linkCalculadoras'
  | 'mas.linkAjustes'

type DescKey =
  | 'mas.linkCalendarioDesc'
  | 'mas.linkPasosDesc'
  | 'mas.linkLogrosDesc'
  | 'mas.linkWearablesDesc'
  | 'mas.linkObjetivosDesc'
  | 'mas.linkTimerDesc'
  | 'mas.linkPesoCorporalDesc'
  | 'mas.linkCuerpoDesc'
  | 'mas.linkMedidasDesc'
  | 'mas.linkFotosProgresoDesc'
  | 'mas.linkNutricionDesc'
  | 'mas.linkSuplementosDesc'
  | 'mas.linkAguaDesc'
  | 'mas.linkBibliotecaDesc'
  | 'mas.linkGuiasDesc'
  | 'mas.linkCalculadorasDesc'
  | 'mas.linkAjustesDesc'

type HubLink = { to: string; labelKey: LabelKey; descKey: DescKey; icon: LucideIcon }

type HubSection = {
  id: string
  labelKey: 'mas.secActividad' | 'mas.secCuerpo' | 'mas.secNutricion' | 'mas.secAprender'
  links: HubLink[]
}

// Catálogo del hub: cuatro secciones + la fila final de Ajustes.
const sections: HubSection[] = [
  {
    id: 'actividad',
    labelKey: 'mas.secActividad',
    links: [
      { to: '/calendario', labelKey: 'mas.linkCalendario', descKey: 'mas.linkCalendarioDesc', icon: CalendarDays },
      { to: '/pasos', labelKey: 'mas.linkPasos', descKey: 'mas.linkPasosDesc', icon: Footprints },
      { to: '/logros', labelKey: 'mas.linkLogros', descKey: 'mas.linkLogrosDesc', icon: Trophy },
      { to: '/wearables', labelKey: 'mas.linkWearables', descKey: 'mas.linkWearablesDesc', icon: Watch },
      { to: '/objetivos', labelKey: 'goals.title', descKey: 'mas.linkObjetivosDesc', icon: Target },
      { to: '/timer', labelKey: 'timer.title', descKey: 'mas.linkTimerDesc', icon: Timer },
    ],
  },
  {
    id: 'cuerpo',
    labelKey: 'mas.secCuerpo',
    links: [
      { to: '/peso-corporal', labelKey: 'mas.linkPesoCorporal', descKey: 'mas.linkPesoCorporalDesc', icon: Scale },
      { to: '/cuerpo', labelKey: 'mas.linkCuerpo', descKey: 'mas.linkCuerpoDesc', icon: Activity },
      { to: '/calculadoras/medidas', labelKey: 'calculadoras.hub.medidas', descKey: 'mas.linkMedidasDesc', icon: Ruler },
      { to: '/progreso-fotos', labelKey: 'mas.linkFotosProgreso', descKey: 'mas.linkFotosProgresoDesc', icon: Camera },
    ],
  },
  {
    id: 'nutricion',
    labelKey: 'mas.secNutricion',
    links: [
      { to: '/nutricion', labelKey: 'mas.linkNutricion', descKey: 'mas.linkNutricionDesc', icon: UtensilsCrossed },
      { to: '/suplementos', labelKey: 'mas.linkSuplementos', descKey: 'mas.linkSuplementosDesc', icon: Pill },
      { to: '/calculadoras/agua', labelKey: 'calculadoras.hub.agua', descKey: 'mas.linkAguaDesc', icon: Droplets },
    ],
  },
  {
    id: 'aprender',
    labelKey: 'mas.secAprender',
    links: [
      { to: '/ejercicios', labelKey: 'mas.linkBiblioteca', descKey: 'mas.linkBibliotecaDesc', icon: BookOpen },
      { to: '/guias', labelKey: 'mas.linkGuias', descKey: 'mas.linkGuiasDesc', icon: BookMarked },
      { to: '/calculadoras', labelKey: 'mas.linkCalculadoras', descKey: 'mas.linkCalculadorasDesc', icon: Calculator },
    ],
  },
]

const settingsLink: HubLink = {
  to: '/ajustes',
  labelKey: 'mas.linkAjustes',
  descKey: 'mas.linkAjustesDesc',
  icon: Settings,
}

// Fila del índice: icono en disco tenue, título + subtítulo y chevron.
const HubRow = ({ link, stagger }: { link: HubLink; stagger?: number }) => {
  const { t } = useTranslation()
  const Icon = link.icon
  return (
    <Link
      to={link.to}
      className={`flex min-h-[53px] items-center gap-3 ${
        stagger ? `stagger-fade stagger-fade-${stagger}` : ''
      }`}
    >
      <span className="flex size-[33px] shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
        <Icon className="size-[15px]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium leading-tight text-fg">{t(link.labelKey)}</span>
        <span className="mt-0.5 block truncate text-[9.5px] leading-tight text-muted">{t(link.descKey)}</span>
      </span>
      <ChevronRight className="size-[15px] shrink-0 text-muted/60" aria-hidden />
    </Link>
  )
}

export const MasPage = () => {
  const { t } = useTranslation()
  const { name } = useProfileName()
  const { avatarUri } = useAvatar()
  const { routine } = useActiveProgram()
  const { activePlan } = usePeriodization()

  const trimmedName = name.trim()
  const displayName = trimmedName || t('mas.sinNombre')
  const initial = trimmedName ? Array.from(trimmedName)[0].toUpperCase() : ''
  // Contexto del héroe: plan de periodización > rutina activa > invitar al perfil.
  const plan: PeriodizationPlan | null = activePlan
    ? {
        id: String(activePlan.id),
        name: activePlan.name,
        mesocycles: activePlan.mesocycles,
        startDate: activePlan.startDate,
        totalWeeks: calculateTotalWeeks(activePlan.mesocycles),
      }
    : null
  const context = plan
    ? `${plan.name} · ${t('mas.semana', {
        n: getCurrentWeek(plan, new Date().toISOString()),
        total: plan.totalWeeks,
      })}`
    : routine?.title ?? t('mas.verPerfil')

  return (
    <div>
      <AppHeader kicker={t('mas.cuenta')} title={t('mas.titulo')} />
      <div className="p-4">
        <Link
          to="/perfil"
          className="flex min-h-[76px] items-center gap-3 border-b border-border/40 pb-4"
        >
          <span className="flex size-[54px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/30 bg-gold/10 font-display text-xl font-light text-gold-bright">
            {avatarUri ? (
              <img src={avatarUri} alt="" className="size-full object-cover" />
            ) : initial ? (
              initial
            ) : (
              <User className="size-5" aria-hidden />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-lg tracking-wide text-fg">{displayName}</span>
            <span className="mt-0.5 block truncate text-[9.5px] text-muted">{context}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted/60" aria-hidden />
        </Link>

        {/* Ancla del tour: solo el índice, sin la cabecera ni el bloque de cuenta. */}
        <nav data-tour="mas-links" aria-label={t('mas.titulo')} className="mt-1">
          {sections.map((section, sectionIndex) => {
            const offset = sections
              .slice(0, sectionIndex)
              .reduce((total, prev) => total + prev.links.length, 0)
            return (
              <section
                key={section.id}
                aria-labelledby={`hub-${section.id}`}
                className={sectionIndex === 0 ? 'pt-2' : 'mt-4 border-t border-border/40 pt-4'}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2
                    id={`hub-${section.id}`}
                    className="text-[9.5px] font-semibold uppercase tracking-[0.19em] text-muted"
                  >
                    {t(section.labelKey)}
                  </h2>
                  <span className="text-[9px] tabular-nums text-muted/70" aria-hidden>
                    {section.links.length}
                  </span>
                </div>
                <ul className="mt-1 divide-y divide-border/40">
                  {section.links.map((link, index) => {
                    const rowIndex = offset + index
                    return (
                      <li key={link.to}>
                        <HubRow link={link} stagger={rowIndex < 8 ? rowIndex + 1 : undefined} />
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}

          {/* Ajustes cierra la página sin abrir una sección de una sola fila. */}
          <section className="mt-5 border-t border-border/70">
            <HubRow link={settingsLink} />
          </section>
        </nav>
      </div>
    </div>
  )
}
