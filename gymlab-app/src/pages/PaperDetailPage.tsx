// Página /papers/:slug: resumen de evidencia, puntos clave y enlace a la fuente oficial.
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { usePaperBySlug } from '@/hooks/usePapers'
import { localizePaper, localizePaperTopic } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'

export const PaperDetailPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { slug } = useParams()

  const { paper } = usePaperBySlug(slug)

  if (!paper) {
    return (
      <div>
        <AppHeader kicker={t('papers.kicker')} title={t('papers.tituloDetalle')} />
        <div className="p-4">
          <BackLink to="/papers" />
          <p className="mt-6 border-t border-border/40 pt-6 text-sm text-muted">
            {t('papers.noEncontrado')}
          </p>
        </div>
      </div>
    )
  }

  const localized = localizePaper(paper, lang)

  return (
    <div>
      <AppHeader
        kicker={localizePaperTopic(paper.topic, lang)}
        title={localized.title}
        subtitle={`${paper.authors} (${paper.year})`}
      />
      <div className="px-4 pb-24 pt-2">
        <BackLink to="/papers" label={t('papers.todosLosPapers')} />

        <article className="mt-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border/40 pb-4">
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gold">
              {localizePaperTopic(paper.topic, lang)} · {paper.year}
            </span>
            {paper.doi ? (
              <span className="break-all text-[10px] text-muted">{t('papers.doi', { doi: paper.doi })}</span>
            ) : null}
          </div>

          <section className="border-b border-border/40 pt-4 pb-5">
            <h2 className="font-display text-xl font-normal text-fg">{t('papers.resumen')}</h2>
            <p className="mt-2 text-[13px] leading-[1.65] text-fg">{localized.summary}</p>
          </section>

          {localized.keyPoints.length > 0 && (
            <section className="border-b border-border/40 pt-4 pb-5">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-display text-xl font-normal text-fg">{t('papers.puntosClave')}</h2>
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

          <a
            href={paper.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-gold/35 px-4 text-sm font-semibold text-gold-bright transition-colors hover:border-gold/60"
          >
            <ExternalLink className="size-4" aria-hidden />
            {t('papers.verFuente')}
          </a>

          <p className="pt-4 text-[10px] leading-relaxed text-muted">{t('papers.disclaimerDetalle')}</p>
        </article>
      </div>
    </div>
  )
}
