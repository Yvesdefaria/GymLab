// Página /guias/:slug: detalle de una guía redactado como artículo continuo.
// Contenido siempre del seed (confiable): se renderiza como texto, sin HTML.
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { useGuideBySlug } from '@/hooks/useGuides'
import { localizeGuide } from '@/i18n/catalog'
import { staggerFade } from '@/lib/animations'
import type { AppLanguage } from '@/domain/onboarding'

export const GuiaDetailPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { slug } = useParams()
  const { guide } = useGuideBySlug(slug)
  const sectionEls = useRef<(HTMLElement | null)[]>([])

  // Anima el cuerpo del artículo en cascada (fade) al entrar en la guía.
  useEffect(() => {
    const els = sectionEls.current.filter((el): el is HTMLElement => el !== null)
    if (els.length > 0) staggerFade(els, { staggerDelay: 50 })
  }, [guide?.id])

  if (!guide) {
    return (
      <div>
        <AppHeader title={t('guias.guia')} />
        <div className="p-4">
          <BackLink to="/guias" />
          <p className="mt-4 text-sm text-muted">{t('guias.noEncontrada')}</p>
        </div>
      </div>
    )
  }

  const localized = localizeGuide(guide, lang)

  return (
    <div>
      <AppHeader title={localized.title} />
      <div className="space-y-4 p-4">
        <BackLink to="/guias" label={t('guias.todasLasGuias')} />

        <article className="space-y-5">
          {/* Entradilla: resumen de la guía como párrafo de apertura. */}
          <p className="text-base leading-relaxed text-accent-soft">{localized.summary}</p>

          {localized.keyPoints.length > 0 && (
            <aside className="panel-light rounded-2xl p-4">
              <h2 className="font-display text-base font-semibold text-accent">
                {t('guias.ideasClave')}
              </h2>
              <ul className="mt-2 space-y-2">
                {localized.keyPoints.map((p) => (
                  <li key={p} className="flex gap-2 text-sm text-fg">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cta" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          {/* Cuerpo: secciones en prosa continua, sin tarjetas separadas. */}
          {localized.sections && localized.sections.length > 0 && (
            <div className="space-y-6">
              {localized.sections.map((section, i) => (
                <section
                  key={section.title}
                  ref={(el) => {
                    sectionEls.current[i] = el
                  }}
                  className="space-y-2"
                >
                  <h2 className="font-display text-lg font-semibold text-accent">
                    {section.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-fg">{section.content}</p>
                  {section.bullets && section.bullets.length > 0 ? (
                    <ul className="space-y-2 pt-1">
                      {section.bullets.map((b) => (
                        <li key={b} className="flex gap-2 text-sm text-muted">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cta" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          )}

          <p className="text-xs text-muted">
            {t('guias.disclaimerDetalle')}
          </p>
        </article>
      </div>
    </div>
  )
}