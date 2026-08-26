import { useTranslation } from 'react-i18next'
import { Shield, Bell } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import {
  AppearanceSection,
  SessionSection,
  NotificationsSection,
  GeneralSection,
  DataSection,
} from '@/components/settings'

export const AjustesPage = () => {
  const { t } = useTranslation()

  return (
    <div>
      <AppHeader title={t('ajustes.titulo')} subtitle={t('ajustes.subtitulo')} />
      <div className="space-y-5 p-4 pb-32">
        <BackLink to="/mas" />
        <AppearanceSection />
        <SessionSection />
        <NotificationsSection />
        <GeneralSection />
        <DataSection />

        <section className="panel-light rounded-2xl p-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
            {t('ajustes.creditos')}
          </h2>
        </section>

        <div className="flex items-start gap-2 rounded-xl border border-border/30 bg-bg-elevated/30 p-3 text-xs text-muted">
          <Bell className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p>{t('ajustes.footerLocal')}</p>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-border/30 bg-bg-elevated/30 p-3 text-xs text-muted">
          <Shield className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p>{t('ajustes.footerNube')}</p>
        </div>
      </div>
    </div>
  )
}
