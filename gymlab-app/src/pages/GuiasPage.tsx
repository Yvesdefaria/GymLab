// Página /guias: listado de guías informativas con enlace a cada detalle.
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookMarked } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { useGuides } from '@/hooks/useGuides'
import { localizeGuide, localizeGuideCategory } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'

export const GuiasPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
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
        {guides.map((g) => {
          const localized = localizeGuide(g, lang)
          return (
          <Link
            key={g.id}
            to={`/guias/${g.slug}`}
            className="flex min-h-[56px] gap-3 panel-flush rounded-2xl border-b border-border/20 px-4 py-3 transition-colors hover:border-gold/80"
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
