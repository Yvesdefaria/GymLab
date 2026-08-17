// Marco general de la app: contenedor centrado, salto de contenido, rutas y barra inferior.
import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router-dom'
import { TabBar } from './TabBar'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { AchievementsHost } from '@/components/achievements/AchievementsHost'
import { Loader } from '@/components/ui/Loader'

// Monta el layout mobile-first, las rutas con lazy loading y el onboarding si procede.
export const AppShell = () => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  // La sesión activa es inmersiva (pantalla completa): oculta la tab bar y quita su padding.
  const isActiveSession = pathname === '/entrenamiento/active'
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-bg md:max-w-3xl lg:max-w-5xl">
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
        key={pathname}
        className={`animate-page-in flex-1 ${isActiveSession ? '' : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))]'}`}
      >
        {/* key={pathname} remonta el contenido en cada ruta para reiniciar animaciones y estado. */}
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </main>
      {!isActiveSession && <TabBar />}
      <Onboarding />
      <AchievementsHost />
    </div>
  )
}
