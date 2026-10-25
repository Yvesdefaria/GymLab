// Página /papers: biblioteca de evidencia con filtros por tema y filas hairline.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { BookOpen, ExternalLink } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { HScroll } from '@/components/ui/HScroll'
import { Chip } from '@/components/ui/Chip'
import { usePapers } from '@/hooks/usePapers'
import { localizePaper, localizePaperTopic } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'

// Temas disponibles para el filtro por chips.
const TOPICS = ['hipertrofia', 'nutricion', 'entrenamiento', 'recuperacion'] as const

export const PapersPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [topicFilter, setTopicFilter] = useState<string | null>(null)

  const { papers } = usePapers()

  // Sin filtro seleccionado se listan todos los papers.
  const filtered = papers.filter((p) => !topicFilter || p.topic === topicFilter)

  return (
    <div>
      <AppHeader
        kicker={t('papers.kicker')}
        title={t('papers.titulo')}
        subtitle={t('papers.subtitulo')}
      />
      <div className="space-y-3 px-4 pb-24 pt-2">
        <BackLink to="/mas" />

        <p className="text-[10px] leading-relaxed text-muted">{t('papers.disclaimer')}</p>

        <HScroll className="pb-1">
          <Chip active={topicFilter === null} onClick={() => setTopicFilter(null)}>
            {t('papers.todosLosPapers')}
          </Chip>
          {TOPICS.map((topic) => (
            <Chip
              key={topic}
              active={topicFilter === topic}
              onClick={() => setTopicFilter(topicFilter === topic ? null : topic)}
            >
              {localizePaperTopic(topic, lang)}
            </Chip>
          ))}
        </HScroll>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="size-8" aria-hidden />}
            message={t('papers.sinResultados')}
          />
        ) : (
          <div>
            {filtered.map((paper) => {
              const localized = localizePaper(paper, lang)
              return (
                <article key={paper.id} className="border-t border-border/40 py-3">
                  <Link to={`/papers/${paper.slug}`} className="block">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gold">
                        {localizePaperTopic(paper.topic, lang)}
                      </span>
                      <span className="text-[10px] tabular-nums text-muted">{paper.year}</span>
                    </div>
                    <h3 className="mt-1 font-display text-[17px] font-normal leading-tight text-fg">
                      {localized.title}
                    </h3>
                    <p className="mt-1 truncate text-[10.5px] text-muted">{paper.authors}</p>
                  </Link>
                  <a
                    href={paper.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-gold/25 px-2.5 text-[9.5px] font-semibold text-gold-bright"
                  >
                    <ExternalLink className="size-3" aria-hidden />
                    {t('papers.verPubMed')}
                  </a>
                </article>
              )
            })}
          </div>
        )}

        <p className="pt-2 text-[10px] leading-relaxed text-muted">{t('papers.disclaimerDetalle')}</p>
      </div>
    </div>
  )
}
