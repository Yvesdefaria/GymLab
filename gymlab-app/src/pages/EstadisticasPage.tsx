// Página /estadisticas: panel de rendimiento (entrenos) y composición corporal.
// Orquesta el TabNav y carga cada pestaña con React.lazy (enfoque A de F91 / F103/T8):
// Recharts viaja con el tab que se activa, no en el chunk inicial de la ruta.
// R3-lazy-tab-failure-path (F103/T8): un chunk que no resuelve (primera visita
// offline) se captura en un boundary LOCAL por tab, sin depender del boundary
// ancestro del router. El reintento recarga la página a propósito: el navegador
// cachea el fallo de fetch del módulo (Chromium no reintenta el import() con la
// misma URL), así que un lazy recreado in-place no recuperaría; la recarga
// reinicia el module map y vuelve a pedir el chunk.
import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { ChartCardVariantProvider } from '@/components/stats/ChartCardVariant'
import { ChartHeightProvider } from '@/components/stats/ChartSizing'
import { TabErrorBoundary } from '@/components/stats/TabErrorBoundary'
import { TabNav } from '@/components/ui/TabNav'

const EntrenoTab = lazy(() =>
  import('@/components/stats/EntrenoTab').then((m) => ({ default: m.EntrenoTab }))
)
const CuerpoTab = lazy(() =>
  import('@/components/stats/CuerpoTab').then((m) => ({ default: m.CuerpoTab }))
)
const FuerzaTab = lazy(() =>
  import('@/components/stats/FuerzaTab').then((m) => ({ default: m.FuerzaTab }))
)
const PeriodizationSection = lazy(() =>
  import('@/components/periodization/PeriodizationSection').then((m) => ({
    default: m.PeriodizationSection,
  }))
)

type StatsTab = 'entreno' | 'cuerpo' | 'fuerza' | 'periodizacion'

// Alturas compactas de los charts de Stats; las demás páginas conservan las suyas.
const STATS_CHART_HEIGHTS = { area: 110, bar: 110, donut: 160 } as const

// Fallback compacto del área del tab: el Loader de pantalla completa del router no
// encaja dentro del panel; anuncia el estado a lectores de pantalla igual.
const TabFallback = () => {
  const { t } = useTranslation()
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t('layout.loader.loading')}
      className="flex min-h-[12rem] items-center justify-center"
    >
      <div
        className="size-6 animate-spin rounded-full border-2 border-border border-t-cta motion-reduce:animate-none"
        aria-hidden
      />
    </div>
  )
}

export const EstadisticasPage = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState<StatsTab>('entreno')

  return (
    <div>
      <AppHeader
        title={t('estadisticas.titulo')}
        kicker={t('estadisticas.kicker')}
      />
      <div className="stats-minimal overflow-hidden space-y-4 px-4 pb-8 pt-4">
        <ChartHeightProvider value={STATS_CHART_HEIGHTS}>
          <ChartCardVariantProvider variant="minimal">
            <TabNav
            ariaLabel={t('estadisticas.seccionesAria')}
            listDataTour="stats-tabs"
            variant="compact"
            tabs={[
              { id: 'entreno', label: t('estadisticas.tabEntreno') },
              { id: 'cuerpo', label: t('estadisticas.tabCuerpo') },
              { id: 'fuerza', label: t('estadisticas.tabFuerza') },
              { id: 'periodizacion', label: t('estadisticas.tabPeriodizacion') },
            ]}
            active={tab}
            onChange={(id) => setTab(id as StatsTab)}
          >
            {/* key por tab: un fallo en un tab no bloquea los demás. */}
            <TabErrorBoundary key={tab} onRetry={() => window.location.reload()}>
              <Suspense fallback={<TabFallback />}>
                {tab === 'entreno' ? (
                  <EntrenoTab />
                ) : tab === 'cuerpo' ? (
                  <CuerpoTab />
                ) : tab === 'fuerza' ? (
                  <FuerzaTab />
                ) : (
                  <PeriodizationSection />
                )}
              </Suspense>
            </TabErrorBoundary>
          </TabNav>
          </ChartCardVariantProvider>
        </ChartHeightProvider>

        <p className="text-center text-xs text-muted">
          {t('estadisticas.disclaimer')}
        </p>
      </div>
    </div>
  )
}
