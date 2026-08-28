// Estructura compartida de las páginas de registro corporal (peso, medidas, grasa):
// cabecera, retroceso, contenedor, estado vacío y disclaimer en un solo lugar.
// El contenido específico de cada página (formulario, último registro, métricas, histórico) va en `children`.
import type { ReactNode } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'

type BodyLogLayoutProps = {
  title: string
  subtitle: string
  backTo: string
  // Cuándo hay registros; si está vacío y `emptyMessage` se define, se muestra el estado vacío.
  hasData: boolean
  emptyMessage?: string
  disclaimer?: string
  children: ReactNode
}

export const BodyLogLayout = ({
  title,
  subtitle,
  backTo,
  hasData,
  emptyMessage,
  disclaimer,
  children,
}: BodyLogLayoutProps) => (
  <div>
    <AppHeader title={title} subtitle={subtitle} />
    <div className="space-y-4 p-4">
      <BackLink to={backTo} />
      {children}
      {!hasData && emptyMessage ? <EmptyState message={emptyMessage} size="lg" /> : null}
      {disclaimer ? <p className="text-center text-xs text-muted">{disclaimer}</p> : null}
    </div>
  </div>
)