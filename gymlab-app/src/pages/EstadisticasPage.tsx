// Página /estadisticas: panel de rendimiento (entrenos) y composición corporal.
// Orquesta el TabNav y delega cada pestaña en su propio componente lazy.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { TabNav } from '@/components/ui/TabNav'
import { PeriodizationSection } from '@/components/periodization/PeriodizationSection'
import { EntrenoTab } from '@/components/stats/EntrenoTab'
import { CuerpoTab } from '@/components/stats/CuerpoTab'
import { FuerzaTab } from '@/components/stats/FuerzaTab'

type StatsTab = 'entreno' | 'cuerpo' | 'fuerza' | 'periodizacion'

export const EstadisticasPage = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState<StatsTab>('entreno')

  return (
    <div>
      <AppHeader title={t('estadisticas.titulo')} subtitle={t('estadisticas.subtitulo')} />
      <div className="overflow-hidden space-y-4 p-4">
        <TabNav
          ariaLabel={t('estadisticas.seccionesAria')}
          tabs={[
            { id: 'entreno', label: t('estadisticas.tabEntreno') },
            { id: 'cuerpo', label: t('estadisticas.tabCuerpo') },
            { id: 'fuerza', label: t('estadisticas.tabFuerza') },
            { id: 'periodizacion', label: t('estadisticas.tabPeriodizacion') },
          ]}
          active={tab}
          onChange={(id) => setTab(id as StatsTab)}
        >
          {tab === 'entreno' ? (
            <EntrenoTab />
          ) : tab === 'cuerpo' ? (
            <CuerpoTab />
          ) : tab === 'fuerza' ? (
            <FuerzaTab />
          ) : (
            <PeriodizationSection />
          )}
        </TabNav>

        <p className="text-center text-xs text-muted">
          {t('estadisticas.disclaimer')}
        </p>
      </div>
    </div>
  )
}
