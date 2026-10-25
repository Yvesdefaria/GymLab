// Página /ajustes (Nocturno Minimal, §10.6 «grupos hairline»): apariencia,
// sesión, series, notificaciones, general, datos, ayuda, sistema, legal y
// zona de peligro al final. Sin tarjetas: una línea superior por grupo.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { App } from '@capacitor/app'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import {
  AppearanceSection,
  SessionSection,
  SeriesSection,
  NotificationsSection,
  GeneralSection,
  HelpSection,
  DataSection,
  DangerZoneSection,
  ReportBugSection,
  TelemetrySection,
  SectionLabel,
  settingsGroupClass,
  settingsRowClass,
} from '@/components/settings'

// Versión mostrada en web/PWA; en Android se lee la real de android/app/build.gradle.
const WEB_VERSION = '1.0.0'

const legalRowClass = `${settingsRowClass} w-full`

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
      <div className="mx-auto w-full max-w-xl px-4 pb-10">
        <BackLink to="/mas" />
        <AppearanceSection />
        {/* Ayuda va arriba a propósito: F101 exige «Volver a ver el tour» visible
            sin scroll a 375×812. Moverla rompe el e2e del tour. */}
        <HelpSection />
        <SessionSection />
        <SeriesSection />
        <NotificationsSection />
        <GeneralSection />
        <DataSection />
        <TelemetrySection />
        <ReportBugSection />

        <section className={settingsGroupClass}>
          <SectionLabel>{t('ajustes.legal')}</SectionLabel>
          <Link to="/terminos" className={`${legalRowClass} border-t border-border/30`}>
            <span>{t('ajustes.terminosLink')}</span>
            <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
          </Link>
          <Link to="/privacidad" className={`${legalRowClass} border-t border-border/30`}>
            <span>{t('ajustes.privacidadLink')}</span>
            <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
          </Link>
          <p className="pb-1 pt-2 text-[11px] leading-relaxed text-muted">{t('ajustes.creditosFotos')}</p>
        </section>

        <DangerZoneSection />

        <div className="mt-4 space-y-2 border-t border-border/40 pt-3 text-[11px] leading-relaxed text-muted">
          <p>{t('ajustes.footerLocal')}</p>
          <p>{t('comun.localFirst')}</p>
        </div>

        <p className="pt-4 text-center text-[11px] text-muted">
          GymLab {t('ajustes.version')} {version}
        </p>
      </div>
    </div>
  )
}
