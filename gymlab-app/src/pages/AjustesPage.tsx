import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { App } from '@capacitor/app'
import { Shield, Bell, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import {
  AppearanceSection,
  SessionSection,
  NotificationsSection,
  GeneralSection,
  DataSection,
  ReportBugSection,
} from '@/components/settings'

// Versión mostrada en web/PWA; en Android se lee la real de android/app/build.gradle.
const WEB_VERSION = '1.0.0'

export const AjustesPage = () => {
  const { t } = useTranslation()
  const [version, setVersion] = useState(WEB_VERSION)

  useEffect(() => {
    let alive = true
    App.getInfo()
      .then((info) => {
        if (alive) setVersion(info.version || WEB_VERSION)
      })
      .catch(() => {
        if (alive) setVersion(WEB_VERSION)
      })
    return () => {
      alive = false
    }
  }, [])

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
        <ReportBugSection />

        <section className="panel-light rounded-2xl p-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
            {t('ajustes.creditos')}
          </h2>
          <Link
            to="/terminos"
            className="mt-2 flex min-h-[48px] w-full items-center justify-between rounded-xl border border-border bg-bg px-3 text-sm text-fg"
          >
            <span>{t('ajustes.terminosLink')}</span>
            <ChevronRight className="size-4 text-muted" />
          </Link>
          <Link
            to="/privacidad"
            className="mt-2 flex min-h-[48px] w-full items-center justify-between rounded-xl border border-border bg-bg px-3 text-sm text-fg"
          >
            <span>{t('ajustes.privacidadLink')}</span>
            <ChevronRight className="size-4 text-muted" />
          </Link>
        </section>

        <div className="flex items-start gap-2 rounded-xl border border-border/30 bg-bg-elevated/30 p-3 text-xs text-muted">
          <Bell className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p>{t('ajustes.footerLocal')}</p>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-border/30 bg-bg-elevated/30 p-3 text-xs text-muted">
          <Shield className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p>{t('comun.localFirst')}</p>
        </div>

        <p className="pt-1 text-center text-xs text-muted">
          GymLab {t('ajustes.version')} {version}
        </p>
      </div>
    </div>
  )
}
