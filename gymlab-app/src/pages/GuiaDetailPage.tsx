// Página /guias/:slug: artículo editorial con ideas clave numeradas y secciones hairline.
// El contenido del seed se renderiza como texto (sin HTML).
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { useGuideBySlug } from '@/hooks/useGuides'
import { localizeGuide, localizeGuideCategory } from '@/i18n/catalog'
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
        <AppHeader kicker={t('guias.kicker')} title={t('guias.guia')} />
        <div className="p-4">
          <BackLink to="/guias" />
          <p className="mt-6 border-t border-border/40 pt-6 text-sm text-muted">
            {t('guias.noEncontrada')}
          </p>
        </div>
      </div>
    )
  }

  const localized = localizeGuide(guide, lang)

  return (
    <div>
      <AppHeader
        kicker={localizeGuideCategory(guide.category, lang)}
        title={localized.title}
      />
      <div className="px-4 pb-24 pt-2">
        <BackLink to="/guias" label={t('guias.todasLasGuias')} />

        <article className="mt-2">
          {/* Entradilla: resumen de la guía como párrafo de apertura. */}
          <p className="border-b border-border/40 pb-5 text-[15px] leading-relaxed text-fg">
            {localized.summary}
          </p>

          {localized.keyPoints.length > 0 && (
            <section className="border-b border-border/40 pt-4 pb-5">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-xl font-normal text-fg">{t('guias.ideasClave')}</h2>
                <span className="text-[9px] tabular-nums text-muted">{localized.keyPoints.length}</span>
              </div>
              <ol className="mt-3 space-y-3">
                {localized.keyPoints.map((point, index) => (
                  <li key={point} className="flex gap-3">
                    <span className="min-w-5 pt-0.5 font-display text-base font-light leading-none text-gold">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[13px] leading-relaxed text-fg">{point}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Cuerpo: secciones en prosa continua, separadas por hairline. */}
          {localized.sections && localized.sections.length > 0 && (
            <div>
              {localized.sections.map((section, i) => (
                <section
                  key={section.title}
                  ref={(el) => {
                    sectionEls.current[i] = el
                  }}
                  className="border-b border-border/40 pt-4 pb-5"
                >
                  <h2 className="font-display text-xl font-normal text-fg">{section.title}</h2>
                  <p className="mt-2 text-[13px] leading-[1.65] text-fg">{section.content}</p>
                  {section.bullets && section.bullets.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {section.bullets.map((b) => (
                        <li key={b} className="flex gap-2 text-[12.5px] leading-relaxed text-muted">
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-gold" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          )}

          <p className="pt-4 text-[10px] leading-relaxed text-muted">
            {t('guias.disclaimerDetalle')}
          </p>
        </article>
      </div>
    </div>
  )
}
