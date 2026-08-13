// Hook que actualiza el SEO on-page (title, description, Open Graph y canonical) por ruta.
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import type { I18nKey } from '@/i18n'

const SITE_URL = 'https://gymlab.app'
const SITE_NAME = 'GymLab'

// Claves de descripción por patrón de ruta; el texto vive en i18n (es/en).
const ROUTE_META: Array<{ pattern: RegExp; key: I18nKey }> = [
  { pattern: /^\/rutinas\/nueva$/, key: 'seo.descRutinaNueva' },
  { pattern: /^\/estadisticas$/, key: 'seo.descEstadisticas' },
  { pattern: /^\/rutinas\//, key: 'seo.descRutinaDetalle' },
  { pattern: /^\/rutinas$/, key: 'seo.descRutinas' },
  { pattern: /^\/papers\//, key: 'seo.descPaperDetalle' },
  { pattern: /^\/papers$/, key: 'seo.descPapers' },
  { pattern: /^\/guias\//, key: 'seo.descGuiaDetalle' },
  { pattern: /^\/guias$/, key: 'seo.descGuias' },
  { pattern: /^\/calculadoras\/imc$/, key: 'seo.descImc' },
  { pattern: /^\/calculadoras\/calorias$/, key: 'seo.descCalorias' },
  { pattern: /^\/calculadoras\/macros$/, key: 'seo.descMacros' },
  { pattern: /^\/calculadoras\/1rm$/, key: 'seo.descOneRm' },
  { pattern: /^\/calculadoras\/agua$/, key: 'seo.descAgua' },
  { pattern: /^\/calculadoras\/conversor$/, key: 'seo.descConversor' },
  { pattern: /^\/calculadoras\/medidas$/, key: 'seo.descMedidas' },
  { pattern: /^\/calculadoras\/grasa$/, key: 'seo.descGrasa' },
  { pattern: /^\/calculadoras$/, key: 'seo.descCalculadoras' },
  { pattern: /^\/ajustes$/, key: 'seo.descAjustes' },
]

// Crea o actualiza una meta tag existente en el head con el contenido indicado.
const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

// Fija el título, descripción y metadatos sociales según la ruta actual.
export const useSeo = (title: string) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  useEffect(() => {
    const fullTitle = title ? `${title} · GymLab` : t('seo.titleDefault')
    const meta = ROUTE_META.find((route) => route.pattern.test(pathname))
    const description = meta ? t(meta.key) : t('seo.descriptionDefault')
    const url = `${SITE_URL}${pathname}`

    document.title = fullTitle
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', `${SITE_URL}/logo.jpg`)
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', `${SITE_URL}/logo.jpg`)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url
  }, [title, pathname, t])
}
