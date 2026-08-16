// Página /papers/:slug: detalle de un paper con resumen, puntos clave y enlace a la fuente.
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ExternalLink, BookOpen } from 'lucide-react'
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
        <AppHeader title={t('papers.tituloDetalle')} />
        <div className="p-4">
          <BackLink to="/papers" />
          <div className="mt-4 panel rounded-2xl p-5 text-center">
            <p className="text-sm text-muted">{t('papers.noEncontrado')}</p>
          </div>
        </div>
      </div>
    )
  }

  const localized = localizePaper(paper, lang)

  return (
    <div>
      <AppHeader title={localized.title} subtitle={`${paper.authors} (${paper.year})`} />
      <div className="space-y-4 p-4">
        <BackLink to="/papers" label={t('papers.todosLosPapers')} />

        {/* Topic badge */}
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-bg px-3 py-1 text-xs font-medium uppercase text-muted">
            {localizePaperTopic(paper.topic, lang)}
          </span>
          <span className="text-xs text-muted">{t('papers.doi', { doi: paper.doi })}</span>
        </div>

        {/* Summary */}
        <div className="panel-light rounded-2xl p-4">
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
            {t('papers.resumen')}
          </h2>
          <p className="text-sm leading-relaxed text-fg">{localized.summary}</p>
        </div>

        {/* Key points */}
        <div className="panel-light rounded-2xl p-4">
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
            {t('papers.puntosClave')}
          </h2>
          <ul className="space-y-2">
            {localized.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-fg">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-cta" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Source link */}
        <a
          href={paper.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 border-cta/30 bg-bg-elevated px-4 py-3 font-display text-base font-semibold text-cta transition-colors hover:border-cta/60"
        >
          <ExternalLink className="size-5" />
          {t('papers.verFuente')}
        </a>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-bg-elevated/40 p-3 text-xs text-muted">
          <BookOpen className="mt-0.5 size-4 shrink-0 text-accent" />
          <p>
            {t('papers.disclaimerDetalle')}
          </p>
        </div>
      </div>
    </div>
  )
}
