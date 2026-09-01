// Página /terminos: Términos y Condiciones y política de privacidad.
// Contenido legal informativo, localizado vía i18n (es fuente, EN overlay).
import { useTranslation } from 'react-i18next'
import { Mail, ShieldCheck } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { CONTACT_EMAIL } from '@/config/contact'

// Claves de las secciones legales en el mismo orden en que se muestran.
const SECTION_KEYS = ['proposito', 'datos', 'permisos', 'responsabilidad', 'menores', 'cambios', 'licencia'] as const

export const TerminosPage = () => {
  const { t } = useTranslation()

  return (
    <div>
      <AppHeader title={t('terminos.titulo')} subtitle={t('terminos.subtitulo')} />
      <div className="space-y-4 p-4 pb-32">
        <BackLink to="/ajustes" />

        <p className="text-xs text-muted">{t('terminos.actualizado', { fecha: '27/08/2026' })}</p>

        {SECTION_KEYS.map((key) => (
          <section key={key} className="panel-light rounded-2xl p-4">
            <h2 className="font-display text-base font-semibold text-accent">{t(`terminos.secciones.${key}.titulo`)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg">{t(`terminos.secciones.${key}.cuerpo`)}</p>
          </section>
        ))}

        <section className="panel-light rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-accent" aria-hidden />
            <h2 className="font-display text-base font-semibold text-accent">{t('terminos.contacto.titulo')}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-fg">
            {t('terminos.contacto.cuerpo', { email: CONTACT_EMAIL })}{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="break-all text-accent-soft underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>

        <div className="flex items-start gap-2 rounded-xl border border-border/30 bg-bg-elevated/30 p-3 text-xs text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          <p>{t('terminos.terminosFooter')}</p>
        </div>
      </div>
    </div>
  )
}
