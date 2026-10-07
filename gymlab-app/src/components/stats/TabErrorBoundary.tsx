// Fallos recuperables por tab lazy (F103/T8-R3): un chunk que no resuelve en la
// primera visita offline no debe tumbar el boundary ancestro: el tab muestra su
// propio estado de error con reintento y el resto de /estadisticas sigue vivo.
import { Component, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

export const TabFailure = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useTranslation()
  return (
    <div
      role="alert"
      className="flex min-h-[12rem] flex-col items-center justify-center gap-3 px-4 text-center"
    >
      <p className="text-sm font-medium text-fg">{t('estadisticas.errorTabTitulo')}</p>
      <p className="text-xs text-muted">{t('estadisticas.errorTabTexto')}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t('estadisticas.errorTabReintentar')}
      </Button>
    </div>
  )
}

interface TabErrorBoundaryProps {
  children: ReactNode
  onRetry: () => void
}

interface TabErrorBoundaryState {
  failed: boolean
}

// Límite LOCAL del tab activo: Suspense no captura errores; sin este boundary el
// throw del chunk rechazado subía al boundary del router y se perdía la página.
export class TabErrorBoundary extends Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  state: TabErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): TabErrorBoundaryState {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return <TabFailure onRetry={this.props.onRetry} />
    return this.props.children
  }
}
