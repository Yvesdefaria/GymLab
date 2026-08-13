// Barra de navegación inferior fija (tab bar) con las secciones principales de la app.
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart3, Dumbbell, LayoutGrid, Menu } from 'lucide-react'

// Definición declarativa de pestañas; `end` limita el estado activo a rutas exactas.
const tabs: {
  to: string
  labelKey:
    | 'layout.tab.entrenar'
    | 'layout.tab.rutinas'
    | 'layout.tab.estadisticas'
    | 'layout.tab.mas'
  icon: typeof Dumbbell
  end?: boolean
}[] = [
  { to: '/', labelKey: 'layout.tab.entrenar', icon: Dumbbell, end: true },
  { to: '/rutinas', labelKey: 'layout.tab.rutinas', icon: LayoutGrid },
  { to: '/estadisticas', labelKey: 'layout.tab.estadisticas', icon: BarChart3 },
  { to: '/mas', labelKey: 'layout.tab.mas', icon: Menu },
]

// Navegación inferior fija, con área táctil cómoda y estado activo resaltado.
export const TabBar = () => {
  const { t } = useTranslation()
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label={t('layout.tabbar.aria')}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {tabs.map(({ to, labelKey, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end ?? false}
              className={({ isActive }) =>
                [
                  'group relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 text-[0.7rem] font-medium transition-colors duration-200',
                  isActive ? 'text-cta' : 'text-muted hover:text-accent-soft',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute top-1.5 h-7 w-14 rounded-full transition-colors duration-200 ${
                      isActive ? 'bg-cta/15' : 'bg-transparent'
                    }`}
                    aria-hidden
                  />
                  <Icon
                    className={`relative size-6 transition-transform duration-200 ${
                      isActive ? 'scale-105' : 'group-active:scale-95'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                    aria-hidden
                  />
                  <span className={`relative ${isActive ? 'gold-text' : undefined}`}>
                    {t(labelKey)}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
