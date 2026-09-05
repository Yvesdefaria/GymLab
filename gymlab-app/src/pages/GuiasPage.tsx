// Página /guias: listado de guías informativas con filtro por categoría y enlace a cada detalle.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookMarked } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { HScroll } from '@/components/ui/HScroll'
import { useGuides } from '@/hooks/useGuides'
import { localizeGuide, localizeGuideCategory } from '@/i18n/catalog'
import { Chip } from '@/components/ui/Chip'
import type { AppLanguage } from '@/domain/onboarding'
import type { GuideCategory } from '@/domain/types'

// Orden canónico de categorías para la fila de filtros; solo se muestran las que tengan guías.
const CATEGORY_ORDER: GuideCategory[] = [
  'entrenamiento',
  'nutricion',
  'dietas',
  'suplementos',
  'mujer',
  'recuperacion',
  'leyenda',
]

// Chip de filtro con estado activo reflejado en aria-pressed (compartido con ExerciseFilterBar).
export const GuiasPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { guides } = useGuides()
  const [category, setCategory] = useState<GuideCategory | null>(null)

  const presentCategories = CATEGORY_ORDER.filter((c) => guides.some((g) => g.category === c))
  const visible = category ? guides.filter((g) => g.category === category) : guides

  return (
    <div>
      <AppHeader title={t('guias.titulo')} subtitle={t('guias.subtitulo')} />
      <div className="space-y-3 p-4">
        <BackLink to="/mas" />
        {presentCategories.length > 1 && (
          <HScroll className="pb-1">
            <Chip active={category === null} onClick={() => setCategory(null)}>
              {t('guias.todasLasGuias')}
            </Chip>
            {presentCategories.map((c) => (
              <Chip
                key={c}
                active={category === c}
                onClick={() => setCategory((prev) => (prev === c ? null : c))}
              >
                {localizeGuideCategory(c, lang)}
              </Chip>
            ))}
          </HScroll>
        )}
        {visible.length === 0 && (
          <EmptyState
            icon={<BookMarked className="size-8" aria-hidden />}
            title={t('guias.sinGuias')}
            message={t('guias.sinGuiasTexto')}
            size="lg"
          />
        )}
        {visible.map((g) => {
          const localized = localizeGuide(g, lang)
          return (
          <Link
            key={g.id}
            to={`/guias/${g.slug}`}
            className="flex min-h-[56px] gap-3 panel-flush rounded-xl border-b border-border/30 px-4 py-3 transition-colors hover:border-gold/80"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-bg text-accent">
              <BookMarked className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-fg">{localized.title}</span>
              <span className="block text-xs text-muted">
                {localizeGuideCategory(g.category, lang)} · {localized.summary}
              </span>
            </span>
          </Link>
          )
        })}
        <p className="pt-2 text-xs text-muted">
          {t('guias.disclaimer')}
        </p>
      </div>
    </div>
  )
}
