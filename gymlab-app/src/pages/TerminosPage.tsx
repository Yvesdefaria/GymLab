// Página /terminos: Términos y Condiciones en formato artículo (TOC + prosa).
// El listado de secciones vive en domain/legal y alimenta TOC y contenido.
import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LegalArticle, type LegalSeccion } from '@/components/legal/LegalArticle'
import { CONTACT_EMAIL } from '@/config/contact'
import { TERMINOS_SECTIONS, TERMINOS_UPDATED } from '@/domain/legal'

export const TerminosPage = () => {
  const { t } = useTranslation()

  const secciones: LegalSeccion[] = TERMINOS_SECTIONS.map((id) => ({
    id,
    titulo: t(`terminos.secciones.${id}.titulo`),
    cuerpo: t(`terminos.secciones.${id}.cuerpo`, { returnObjects: true, email: CONTACT_EMAIL }) as string[],
  }))

  const contactoParrafos: ReactNode = (
    <p>
      {t('terminos.contacto.cuerpo', { email: CONTACT_EMAIL })}{' '}
      <a href={`mailto:${CONTACT_EMAIL}`} className="break-all text-accent-soft underline">
        {CONTACT_EMAIL}
      </a>
    </p>
  )

  return (
    <LegalArticle
      title={t('terminos.titulo')}
      subtitle={t('terminos.subtitulo')}
      updated={t('terminos.actualizado', { fecha: TERMINOS_UPDATED })}
      tocLabel={t('terminos.tocLabel')}
      backTo="/ajustes"
      secciones={secciones}
      contacto={{ titulo: t('terminos.contacto.titulo'), parrafos: contactoParrafos }}
      footer={t('terminos.terminosFooter')}
      intro={
        <Trans i18nKey="terminos.politicaIntro">
          Lee también nuestra <Link to="/privacidad" className="text-accent-soft underline">Política de privacidad</Link>.
        </Trans>
      }
    />
  )
}