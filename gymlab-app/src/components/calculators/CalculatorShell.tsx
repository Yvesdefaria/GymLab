// Shell común de las calculadoras: cabecera con kicker, back a /calculadoras y contenido.
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'

export const CalculatorShell = ({
  title,
  subtitle,
  kicker,
  backTo = '/calculadoras',
  children,
}: {
  title: string
  subtitle?: string
  kicker?: string
  backTo?: string
  children: ReactNode
}) => {
  const { t } = useTranslation()
  return (
    <div>
      <AppHeader
        kicker={kicker ?? t('calculadoras.hub.titulo')}
        title={title}
        subtitle={subtitle}
      />
      <div className="space-y-4 px-4 pb-24 pt-2">
        <BackLink to={backTo} />
        {children}
      </div>
    </div>
  )
}
