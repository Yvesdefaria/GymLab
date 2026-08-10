// Página /guias/:slug: detalle de una guía informativa.
// Contenido siempre del seed (confiable): se renderiza como texto, sin HTML.
import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { useGuideBySlug } from '@/hooks/useGuides'
import { staggerFade } from '@/lib/animations'

export const GuiaDetailPage = () => {
  const { slug } = useParams()
  const { guide } = useGuideBySlug(slug)
  const sectionsRef = useRef<(HTMLElement | null)[]>([])

  // Anima las secciones en cascada (fade) al entrar en la guía.
  useEffect(() => {
    const els = sectionsRef.current.filter((el): el is HTMLElement => el !== null)
    if (els.length > 0) staggerFade(els, { staggerDelay: 50 })
  }, [guide?.id])

  if (!guide) {
    return (
      <div>
        <AppHeader title="Guía" />
        <div className="p-4">
          <BackLink to="/guias" />
          <p className="mt-4 text-sm text-muted">Guía no encontrada.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHeader title={guide.title} subtitle={guide.summary} />
      <div className="space-y-4 p-4">
        <BackLink to="/guias" label="Todas las guías" />

        {guide.sections && guide.sections.length > 0 ? (
          <div className="space-y-4">
            {guide.sections.map((section) => (
              <section
                key={section.title}
                ref={(el) => {
                  if (el) sectionsRef.current[guide.sections!.indexOf(section)] = el
                }}
                className="panel rounded-2xl p-4"
              >                <h2 className="font-display text-base font-semibold text-accent">
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-fg">{section.content}</p>
                {section.bullets && section.bullets.length > 0 ? (
                  <ul className="mt-3 space-y-2">
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
        ) : (
          <ul className="space-y-3 panel rounded-2xl p-4">
            {guide.keyPoints.map((p) => (
              <li key={p} className="flex gap-2 text-sm text-fg">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cta" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-muted">
          Informativo, no consejo médico. Consulta a un profesional de la salud.
        </p>
      </div>
    </div>
  )
}
