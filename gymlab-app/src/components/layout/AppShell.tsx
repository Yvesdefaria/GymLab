// Marco general de la app: contenedor centrado, salto de contenido, rutas y barra inferior.
import { Suspense, lazy, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, Outlet } from 'react-router-dom'
import { useSettings } from '@/hooks/useSettings'
import { applyTelemetryConsent, track } from '@/lib/telemetry'
import { TabBar } from './TabBar'
import { AchievementsHost } from '@/components/achievements/AchievementsHost'
import { Loader } from '@/components/ui/Loader'

const Onboarding = lazy(() =>
  import('@/components/onboarding/Onboarding').then((m) => ({ default: m.Onboarding }))
)

// Monta el layout mobile-first, las rutas con lazy loading y el onboarding si procede.
export const AppShell = () => {
  const { t } = useTranslation()
  const { pathname, search } = useLocation()
  const { settings, loaded } = useSettings()
  const telemetryBooted = useRef(false)

  // Inicia la telemetría solo al conocer el consentimiento persistido, respetando el toggle de Ajustes.
  useEffect(() => {
    if (!loaded || telemetryBooted.current) return
    telemetryBooted.current = true
    void applyTelemetryConsent(settings.telemetry)
  }, [loaded, settings.telemetry])

  // Registra cada pantalla visitada (ruta + query) de forma anónima.
  useEffect(() => {
    const path = `${pathname}${search}`
    track('screen_view', { path })
    const calc = pathname.match(/^\/calculadoras\/([a-z0-9-]+)\/?$/)
    if (calc) track('calculator_opened', { slug: calc[1] })
  }, [pathname, search])

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
