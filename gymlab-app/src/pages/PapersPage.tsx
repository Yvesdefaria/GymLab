// Página /papers: biblioteca de papers con filtros por tema y tarjetas con resumen.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronRight, BookOpen, ExternalLink } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { usePapers } from '@/hooks/usePapers'

// Temas disponibles para el filtro por chips.
const TOPICS = ['hipertrofia', 'nutricion', 'entrenamiento', 'recuperacion'] as const

const topicLabels: Record<string, string> = {
  hipertrofia: 'Hipertrofia',
  nutricion: 'Nutrición',
  entrenamiento: 'Entrenamiento',
  recuperacion: 'Recuperación',
}

export const PapersPage = () => {
  const { t } = useTranslation()
  const [topicFilter, setTopicFilter] = useState<string | null>(null)

  const { papers } = usePapers()

  // Sin filtro seleccionado se listan todos los papers.
  const filtered = papers.filter((p) => !topicFilter || p.topic === topicFilter)

  return (
    <div>
      <AppHeader
        title={t('papers.titulo')}
        subtitle={t('papers.subtitulo')}
      />
      <div className="space-y-4 p-4">
        {/* Disclaimer */}
        <div className="rounded-2xl border border-border/60 bg-bg-elevated/40 p-3 text-xs text-muted">
          {t('papers.disclaimer')}
        </div>

        {/* Topic filters */}
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => setTopicFilter(topicFilter === topic ? null : topic)}
              className={`inline-flex min-h-[44px] items-center rounded-full px-3 text-xs font-medium capitalize transition-colors ${
                topicFilter === topic
                  ? 'border border-cta bg-cta/20 text-accent-soft'
                  : 'border border-border text-muted hover:border-cta hover:text-accent-soft'
              }`}
            >
              {topicLabels[topic] ?? topic}
            </button>
          ))}
        </div>

        {/* Paper cards */}
        <div className="space-y-3">
          {filtered.map((paper) => (
            <div
              key={paper.id}
              className="panel rounded-2xl p-4 transition-colors hover:border-gold/80"
            >
              <Link to={`/papers/${paper.slug}`} className="block">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-sm font-semibold text-fg">{paper.title}</h3>
                    <p className="mt-0.5 text-xs text-muted">{paper.authors} ({paper.year})</p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted" />
                </div>
                <p className="line-clamp-2 text-sm text-accent-soft">{paper.summary}</p>
                <span className="mt-2 inline-block rounded-full bg-bg px-2 py-0.5 text-[0.65rem] font-medium uppercase text-muted">
                  {topicLabels[paper.topic] ?? paper.topic}
                </span>
              </Link>
              <a
                href={paper.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex min-h-[44px] items-center gap-1 text-xs text-cta hover:underline"
              >
                <ExternalLink className="size-3" />
                PubMed
              </a>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-6 text-center">
              <BookOpen className="mx-auto mb-2 size-8 text-muted" />
              <p className="text-sm text-muted">{t('papers.sinResultados')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
