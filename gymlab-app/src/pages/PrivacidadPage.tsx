// Página /privacidad: Política de Privacidad en formato artículo (TOC + prosa).
// Refleja la realidad local-first y, como «lista para monetización», los
// servicios (AdMob/Firebase/Play Billing) que se activarán en versiones futuras.
import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LegalArticle, type LegalSeccion } from '@/components/legal/LegalArticle'
import { CONTACT_EMAIL } from '@/config/contact'
import { PRIVACIDAD_SECTIONS, PRIVACIDAD_UPDATED } from '@/domain/legal'

export const PrivacidadPage = () => {
  const { t } = useTranslation()

  const secciones: LegalSeccion[] = PRIVACIDAD_SECTIONS.map((id) => ({
    id,
    titulo: t(`privacidad.secciones.${id}.titulo`),
    cuerpo: t(`privacidad.secciones.${id}.cuerpo`, { returnObjects: true, email: CONTACT_EMAIL }) as string[],
  }))

  const contactoParrafos: ReactNode = (
    <p>
      {t('privacidad.contacto.cuerpo', { email: CONTACT_EMAIL })}{' '}
      <a href={`mailto:${CONTACT_EMAIL}`} className="break-all text-accent-soft underline">
        {CONTACT_EMAIL}
      </a>
    </p>
  )

  return (
    <LegalArticle
      title={t('privacidad.titulo')}
      subtitle={t('privacidad.subtitulo')}
      updated={t('privacidad.actualizado', { fecha: PRIVACIDAD_UPDATED })}
      tocLabel={t('privacidad.tocLabel')}
      backTo="/ajustes"
      secciones={secciones}
      contacto={{ titulo: t('privacidad.contacto.titulo'), parrafos: contactoParrafos }}
      footer={t('privacidad.privacidadFooter')}
      intro={
        <Trans i18nKey="privacidad.terminosIntro">
          Consulta también nuestros <Link to="/terminos" className="text-accent-soft underline">Términos y Condiciones</Link>.
        </Trans>
      }
    />
  )
}