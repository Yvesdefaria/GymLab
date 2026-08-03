import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, BookOpen } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { useLiveQuery } from 'dexie-react-hooks'
import { paperRepo } from '@/data/repositories'

const topicLabels: Record<string, string> = {
  hipertrofia: 'Hipertrofia',
  nutricion: 'Nutrición',
  entrenamiento: 'Entrenamiento',
  recuperacion: 'Recuperación',
}

export const PaperDetailPage = () => {
  const { slug } = useParams()

  const paper = useLiveQuery(
    () => (slug ? paperRepo.getBySlug(slug) : undefined),
    [slug]
  )

  if (!paper) {
    return (
      <div>
        <AppHeader title="Paper" />
        <div className="p-4">
          <Link to="/papers" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft">
            <ArrowLeft className="size-4" /> Volver
          </Link>
          <div className="mt-4 rounded-2xl border border-border bg-bg-elevated p-5 text-center">
            <p className="text-sm text-muted">Paper no encontrado.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHeader title={paper.title} subtitle={`${paper.authors} (${paper.year})`} />
      <div className="space-y-4 p-4">
        <Link
          to="/papers"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft"
        >
          <ArrowLeft className="size-4" />
          Todos los papers
        </Link>

        {/* Topic badge */}
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-bg px-3 py-1 text-xs font-medium uppercase text-muted">
            {topicLabels[paper.topic] ?? paper.topic}
          </span>
          <span className="text-xs text-muted">DOI: {paper.doi}</span>
        </div>

        {/* Summary */}
        <div className="rounded-2xl border border-border bg-bg-elevated p-4">
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
            Resumen
          </h2>
          <p className="text-sm leading-relaxed text-fg">{paper.summary}</p>
        </div>

        {/* Key points */}
        <div className="rounded-2xl border border-border bg-bg-elevated p-4">
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
            Puntos clave
          </h2>
          <ul className="space-y-2">
            {paper.keyPoints.map((point, i) => (
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
          Ver fuente oficial
        </a>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-bg-elevated/40 p-3 text-xs text-muted">
          <BookOpen className="mt-0.5 size-4 shrink-0 text-accent" />
          <p>
            Este resumen es informativo y no sustituye la lectura del estudio original.
            Consulta siempre la fuente oficial.
          </p>
        </div>
      </div>
    </div>
  )
}
