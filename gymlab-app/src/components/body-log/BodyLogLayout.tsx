// Estructura compartida de las páginas de registro corporal (medidas, grasa):
// cabecera, retroceso, estado vacío y disclaimer. El contenido va en `children`.
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'

type BodyLogLayoutProps = {
  title: string
  subtitle: string
  backTo: string
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
}: BodyLogLayoutProps) => {
  const { t } = useTranslation()
  return (
    <div>
      <AppHeader kicker={t('calculadoras.hub.titulo')} title={title} subtitle={subtitle} />
      <div className="space-y-4 px-4 pb-24 pt-2">
        <BackLink to={backTo} />
        {children}
        {!hasData && emptyMessage ? <EmptyState message={emptyMessage} size="lg" /> : null}
        {disclaimer ? <p className="text-[9.5px] leading-relaxed text-muted">{disclaimer}</p> : null}
      </div>
    </div>
  )
}
