// Marco general de la app: shell siempre visible; el contenido y los hosts que
// dependen de datos esperan a que el seed termine (F103/T3).
import { Suspense, lazy, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, Outlet } from 'react-router-dom'
import { useSeedingStatus } from '@/app/seeding'
import { useSettings } from '@/hooks/useSettings'
import { useNotificationScheduling } from '@/hooks/useNotifications'
import { useHealthSyncHost } from '@/hooks/useHealthSyncHost'
import { AchievementsDataProvider } from '@/hooks/useAchievementsData'
import { applyTelemetryConsent, track } from '@/lib/telemetry'
import { TabBar } from './TabBar'
import { Loader } from '@/components/ui/Loader'
import { SeedingGate } from './SeedingGate'
import { TourHost } from '@/components/tour/TourHost'
import { SectionTipHost } from '@/components/tour/SectionTipHost'

const Onboarding = lazy(() =>
  import('@/components/onboarding/Onboarding').then((m) => ({ default: m.Onboarding }))
)

// Host de logros lazy: solo difiere el chunk del modal. Las liveQueries de
// Dexie viven en AchievementsDataProvider (eager, capa única compartida con
// /logros); al ser reactivas, cualquier desbloqueo posterior sigue capturándose.
const AchievementsHost = lazy(() =>
  import('@/components/achievements/AchievementsHost').then((m) => ({ default: m.AchievementsHost }))
)

// Hosts que tocan datos sembrables (recordatorios y salud): no deben montarse
// durante el reseed, cuando los catálogos se vacían y reconstruyen.
const DataHosts = () => {
  useNotificationScheduling()
  useHealthSyncHost()
  return null
}

// Monta el layout mobile-first, las rutas con lazy loading y el onboarding si procede.
export const AppShell = () => {
  const { t } = useTranslation()
  const { pathname, search } = useLocation()
  const { settings, loaded } = useSettings()
  const { status, error, retry } = useSeedingStatus()
  const ready = status === 'ready'
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
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-bg overflow-x-clip md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl">
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
        {ready ? (
          // Capa única de datos de logros para toda la app: el host global y
          // /logros (y perfil/pasos) comparten el mismo fan-out de Dexie.
          <AchievementsDataProvider>
            <Suspense fallback={<Loader />}>
              <Outlet />
            </Suspense>
            <Suspense fallback={null}>
              <AchievementsHost />
            </Suspense>
          </AchievementsDataProvider>
        ) : (
          <SeedingGate status={status} error={error} onRetry={retry} />
        )}
      </main>
      <TabBar />
      {ready && (
        <>
          <DataHosts />
          <Suspense fallback={null}>
            <Onboarding />
          </Suspense>
          <TourHost />
          <SectionTipHost />
        </>
      )}
    </div>
  )
}
