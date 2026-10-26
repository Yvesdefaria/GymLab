// Barra de navegación inferior fija (tab bar) con las secciones principales de la app.
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BarChart3, Dumbbell, LayoutGrid, Menu } from 'lucide-react'
import { SHELL_MAX_W } from './shellWidth'

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

// Navegación inferior Nocturno Minimal: hairline en vez de tarjeta, regla de 2 px
// sobre el borde superior para el activo y etiquetas Barlow en mayúsculas.
export const TabBar = () => {
  const { t } = useTranslation()
  return (
    <nav
      data-tour="tabbar"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/40 bg-bg/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label={t('layout.tabbar.aria')}
    >
      <ul className={`mx-auto flex ${SHELL_MAX_W} items-stretch justify-around`}>
        {tabs.map(({ to, labelKey, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end ?? false}
              className={({ isActive }) =>
                [
                  'group relative flex min-h-[56px] flex-col items-center justify-center gap-1 px-1',
                  'text-[0.5625rem] font-semibold uppercase leading-none tracking-[0.14em] transition-colors duration-200',
                  isActive ? 'text-cta' : 'text-muted',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {/* Regla superior: marca la pestaña activa sobre el hairline del nav. */}
                  <span
                    className={`absolute -top-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full ${
                      isActive ? 'bg-cta' : 'bg-transparent'
                    }`}
                    aria-hidden
                  />
                  <Icon className="relative size-[21px]" strokeWidth={2} aria-hidden />
                  <span className="relative">{t(labelKey)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
