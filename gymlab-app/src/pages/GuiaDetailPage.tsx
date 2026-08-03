import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppHeader } from '@/components/layout/AppHeader'
import { guideRepo } from '@/data/repositories'

export const GuiaDetailPage = () => {
  const { slug } = useParams()
  const guide = useLiveQuery(() => (slug ? guideRepo.getBySlug(slug) : undefined), [slug])

  if (!guide) {
    return (
      <div>
        <AppHeader title="Guía" />
        <div className="p-4">
          <Link to="/guias" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft">
            <ArrowLeft className="size-4" /> Volver
          </Link>
          <p className="mt-4 text-sm text-muted">Guía no encontrada.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHeader title={guide.title} subtitle={guide.summary} />
      <div className="space-y-4 p-4">
        <Link to="/guias" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft">
          <ArrowLeft className="size-4" /> Todas las guías
        </Link>
        <ul className="space-y-3 rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          {guide.keyPoints.map((p) => (
            <li key={p} className="flex gap-2 text-sm text-fg">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cta" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">
          Informativo, no consejo médico. Consulta a un profesional de la salud.
        </p>
      </div>
    </div>
  )
}
