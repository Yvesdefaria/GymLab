// Página /estadisticas: panel de rendimiento (entrenos) y composición corporal.
// Orquesta el TabNav y carga cada pestaña con React.lazy (enfoque A de F91 / F103/T8):
// Recharts viaja con el tab que se activa, no en el chunk inicial de la ruta.
import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
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
      <AppHeader title={t('estadisticas.titulo')} subtitle={t('estadisticas.subtitulo')} />
      <div className="overflow-hidden space-y-4 p-4">
        <TabNav
          ariaLabel={t('estadisticas.seccionesAria')}
          listDataTour="stats-tabs"
          tabs={[
            { id: 'entreno', label: t('estadisticas.tabEntreno') },
            { id: 'cuerpo', label: t('estadisticas.tabCuerpo') },
            { id: 'fuerza', label: t('estadisticas.tabFuerza') },
            { id: 'periodizacion', label: t('estadisticas.tabPeriodizacion') },
          ]}
          active={tab}
          onChange={(id) => setTab(id as StatsTab)}
        >
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
        </TabNav>

        <p className="text-center text-xs text-muted">
          {t('estadisticas.disclaimer')}
        </p>
      </div>
    </div>
  )
}
