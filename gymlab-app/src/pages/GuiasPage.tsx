// Página /guias: listado de guías informativas con enlace a cada detalle.
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookMarked } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { useGuides } from '@/hooks/useGuides'
import type { GuideCategory } from '@/domain/types'

// Etiqueta visible en español para cada categoría de guía.
const catLabel: Record<GuideCategory, string> = {
  entrenamiento: 'Entrenamiento',
  nutricion: 'Nutrición',
  dietas: 'Dietas',
  suplementos: 'Suplementos',
  mujer: 'Mujer',
  recuperacion: 'Recuperación',
}

export const GuiasPage = () => {
  const { t } = useTranslation()
  const { guides } = useGuides()

  return (
    <div>
      <AppHeader title={t('guias.titulo')} subtitle={t('guias.subtitulo')} />
      <div className="space-y-3 p-4">
        <BackLink to="/mas" />
        {guides.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-8 text-center">
            <BookMarked className="mx-auto mb-3 size-8 text-muted" aria-hidden />
            <p className="text-sm font-medium text-fg">{t('guias.sinGuias')}</p>
            <p className="mt-1 text-xs text-muted">
              {t('guias.sinGuiasTexto')}
            </p>
          </div>
        )}
        {guides.map((g) => (
          <Link
            key={g.id}
            to={`/guias/${g.slug}`}
            className="flex min-h-[56px] gap-3 panel rounded-2xl px-4 py-3 transition-colors hover:border-gold/80"
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
          {t('guias.disclaimer')}
        </p>
      </div>
    </div>
  )
}
