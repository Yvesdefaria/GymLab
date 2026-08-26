// Marco general de la app: contenedor centrado, salto de contenido, rutas y barra inferior.
import { Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router-dom'
import { TabBar } from './TabBar'
import { AchievementsHost } from '@/components/achievements/AchievementsHost'
import { Loader } from '@/components/ui/Loader'

const Onboarding = lazy(() =>
  import('@/components/onboarding/Onboarding').then((m) => ({ default: m.Onboarding }))
)

// Monta el layout mobile-first, las rutas con lazy loading y el onboarding si procede.
export const AppShell = () => {
  const { t } = useTranslation()
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-bg overflow-x-clip md:max-w-3xl lg:max-w-5xl">
      <div className="app-grain" aria-hidden="true" />
      {/* Enlace de accesibilidad para saltar directamente al contenido principal. */}
      <a
        href="#contenido"
        className="sr-only z-[100] rounded-lg bg-cta px-4 py-2 text-sm font-semibold text-on-gold focus:not-sr-only focus:absolute focus:left-3 focus:top-3"
      >
        {t('layout.shell.skipToContent')}
      </a>
      <main
        id="contenido"
        className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
      >
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </main>
      <TabBar />
      <Suspense fallback={null}>
        <Onboarding />
      </Suspense>
      <AchievementsHost />
    </div>
  )
}
