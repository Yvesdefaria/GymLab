// Barra de navegación inferior fija (tab bar) con las secciones principales de la app.
import { NavLink } from 'react-router-dom'
import { BarChart3, Dumbbell, LayoutGrid, Menu } from 'lucide-react'

// Definición declarativa de pestañas; `end` limita el estado activo a rutas exactas.
const tabs: {
  to: string
  label: string
  icon: typeof Dumbbell
  end?: boolean
}[] = [
  { to: '/', label: 'Entrenar', icon: Dumbbell, end: true },
  { to: '/rutinas', label: 'Rutinas', icon: LayoutGrid },
  { to: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { to: '/mas', label: 'Más', icon: Menu },
]

// Navegación inferior fija, con área táctil cómoda y estado activo resaltado.
export const TabBar = () => {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegación principal"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end ?? false}
              className={({ isActive }) =>
                [
                  'flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 text-[0.7rem] font-medium transition-colors duration-200',
                  isActive ? 'text-cta' : 'text-muted hover:text-accent-soft',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="size-6"
                    strokeWidth={isActive ? 2.5 : 2}
                    aria-hidden
                  />
                  <span className={isActive ? 'gold-text' : undefined}>
                    {label}
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
