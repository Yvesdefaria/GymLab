// Red de seguridad de último recurso: sin esto, una excepción no capturada durante el
// render de una ruta desmontaba TODO el árbol de React y la app quedaba en pantalla
// negra sin salida (así se manifestaron el crash de /suplementos por el `liveQuery` y
// el de los chunks lazy servidos por el service worker). Muestra un mensaje recuperable
// en vez de dejar al usuario sin app.
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { i18n } from '@/i18n'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Queda en consola para poder diagnosticarlo desde el dispositivo (logcat).
    console.error('[AppErrorBoundary]', error, info.componentStack)
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg p-6 text-center">
        <p className="text-sm font-medium text-fg">{i18n.t('errorBoundary.titulo')}</p>
        <p className="max-w-[280px] text-xs text-muted">{i18n.t('errorBoundary.cuerpo')}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-[44px] rounded-xl bg-cta px-4 text-sm font-medium text-accent-fg"
        >
          {i18n.t('errorBoundary.reintentar')}
        </button>
      </div>
    )
  }
}
