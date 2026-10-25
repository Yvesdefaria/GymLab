// Página /guias: índice editorial con una guía destacada y el resto numerado.
// Las categorías presentes filtran; el orden canónico vive en domain/guideIndex.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookMarked, ChevronRight } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { EmptyState } from '@/components/ui/EmptyState'
import { HScroll } from '@/components/ui/HScroll'
import { Chip } from '@/components/ui/Chip'
import { useGuides } from '@/hooks/useGuides'
import { GUIDE_CATEGORY_ORDER, splitGuides } from '@/domain/guideIndex'
import { localizeGuide, localizeGuideCategory } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'
import type { GuideCategory } from '@/domain/types'

export const GuiasPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { guides } = useGuides()
  const [category, setCategory] = useState<GuideCategory | null>(null)

  const visible = category ? guides.filter((g) => g.category === category) : guides
  const presentCategories = GUIDE_CATEGORY_ORDER.filter((c) => guides.some((g) => g.category === c))
  const { featured, rest } = splitGuides(visible)

  return (
    <div>
      <AppHeader
        kicker={t('guias.kicker')}
        title={t('guias.titulo')}
        subtitle={t('guias.subtitulo')}
      />
      <div className="space-y-3 px-4 pb-24 pt-2">
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

        {featured && (
          <section className="border-b border-border/40 pb-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gold">
              {t('guias.destacada')} · {localizeGuideCategory(featured.category, lang)}
            </p>
            <Link to={`/guias/${featured.slug}`} className="mt-2 block">
              <h2 className="font-display text-[25px] font-normal leading-[1.12] text-fg">
                {localizeGuide(featured, lang).title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {localizeGuide(featured, lang).summary}
              </p>
              <p className="mt-2 text-[9px] uppercase tracking-[0.14em] text-muted">
                {t('guias.ideasClaveCount', { count: localizeGuide(featured, lang).keyPoints.length })}
              </p>
            </Link>
          </section>
        )}

        {rest.length > 0 && (
          <>
            <div className="flex items-baseline justify-between gap-2 pt-1">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                {t('guias.todasLasGuias')}
              </h2>
              <span className="text-[10px] tabular-nums text-muted">
                {t('guias.todasLasGuiasCount', { count: rest.length })}
              </span>
            </div>
            <div>
              {rest.map((g, index) => {
                const localized = localizeGuide(g, lang)
                return (
                  <Link
                    key={g.id}
                    to={`/guias/${g.slug}`}
                    className="flex min-h-[64px] items-start gap-3 border-t border-border/40 py-3"
                  >
                    <span className="min-w-6 pt-0.5 font-display text-base font-light tabular-nums text-muted/80">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[9px] font-semibold uppercase tracking-[0.16em] text-gold">
                        {localizeGuideCategory(g.category, lang)}
                      </span>
                      <span className="mt-0.5 block text-sm font-medium leading-snug text-fg">
                        {localized.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[10.5px] text-muted">
                        {localized.summary}
                      </span>
                    </span>
                    <ChevronRight className="mt-2 size-4 shrink-0 text-muted" aria-hidden />
                  </Link>
                )
              })}
            </div>
          </>
        )}

        <p className="pt-2 text-[10px] leading-relaxed text-muted">{t('guias.disclaimer')}</p>
      </div>
    </div>
  )
}
