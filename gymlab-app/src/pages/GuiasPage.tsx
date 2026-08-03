import { Link } from 'react-router-dom'
import { ArrowLeft, BookMarked } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppHeader } from '@/components/layout/AppHeader'
import { guideRepo } from '@/data/repositories'
import type { GuideCategory } from '@/domain/types'

const catLabel: Record<GuideCategory, string> = {
  entrenamiento: 'Entrenamiento',
  nutricion: 'Nutrición',
  dietas: 'Dietas',
  suplementos: 'Suplementos',
  mujer: 'Mujer',
  recuperacion: 'Recuperación',
}

export const GuiasPage = () => {
  const guides = useLiveQuery(() => guideRepo.getAll(), []) ?? []

  return (
    <div>
      <AppHeader title="Guías" subtitle="Nutrición, recuperación y bases" />
      <div className="space-y-3 p-4">
        <Link to="/mas" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft">
          <ArrowLeft className="size-4" /> Más
        </Link>
        {guides.map((g) => (
          <Link
            key={g.id}
            to={`/guias/${g.slug}`}
            className="flex min-h-[56px] gap-3 rounded-2xl border border-gold/40 bg-bg-elevated px-4 py-3 transition-colors hover:border-gold/80"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-bg text-accent">
              <BookMarked className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-fg">{g.title}</span>
              <span className="block text-xs text-muted">
                {catLabel[g.category]} · {g.summary}
              </span>
            </span>
          </Link>
        ))}
        <p className="pt-2 text-xs text-muted">
          Contenido informativo. No sustituye consejo médico ni nutricional profesional.
        </p>
      </div>
    </div>
  )
}
