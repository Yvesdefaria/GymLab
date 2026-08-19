// Templates de sesión rápida: lista de rutinas pre-armadas.
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Zap, Clock, ChevronRight } from 'lucide-react'
import {
  quickTemplates,
  templateCategories,
  type QuickTemplateCategory,
} from '@/domain/quickTemplates'
import { prefersReducedMotion } from '@/lib/animations'
import anime from 'animejs'

const categoryColor: Record<QuickTemplateCategory, string> = {
  express: 'border-accent/40 bg-accent/10',
  stretch: 'border-success/40 bg-success/10',
  mobility: 'border-warning/40 bg-warning/10',
}

export const QuickTemplates = () => {
  const { t } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState<QuickTemplateCategory | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = selectedCategory
    ? quickTemplates.filter((q) => q.category === selectedCategory)
    : quickTemplates

  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion()) return
    anime({
      targets: containerRef.current.children,
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 250,
      delay: anime.stagger(40),
      easing: 'easeOutCubic',
    })
  }, [selectedCategory])

  return (
    <div className="flex flex-col gap-3">
      <p className="kicker">{t('quickTemplates.title')}</p>

      {/* Selector de categoría */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`rounded-lg px-2 py-1.5 text-[0.65rem] font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-accent text-accent-fg'
              : 'bg-bg-elevated/50 text-muted hover:bg-bg-elevated'
          }`}
        >
          {t('quickTemplates.all')}
        </button>
        {templateCategories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`rounded-lg px-2 py-1.5 text-[0.65rem] font-medium transition-colors ${
              selectedCategory === cat.key
                ? 'bg-accent text-accent-fg'
                : 'bg-bg-elevated/50 text-muted hover:bg-bg-elevated'
            }`}
          >
            {cat.key === 'express'
              ? t('quickTemplates.categories.express')
              : cat.key === 'stretch'
                ? t('quickTemplates.categories.stretch')
                : t('quickTemplates.categories.mobility')}
          </button>
        ))}
      </div>

      {/* Lista de templates */}
      <div ref={containerRef} className="flex flex-col gap-2">
        {filtered.map((tpl) => (
          <div
            key={tpl.id}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${categoryColor[tpl.category]}`}
          >
            <Zap className="size-4 shrink-0 text-accent" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-fg">
                {tpl.id === 'full-body-express'
                  ? t('quickTemplates.fullBodyExpress')
                  : tpl.id === 'core-express'
                    ? t('quickTemplates.coreExpress')
                    : tpl.id === 'full-body-stretch'
                      ? t('quickTemplates.fullBodyStretch')
                      : tpl.id === 'pre-sleep-stretch'
                        ? t('quickTemplates.preSleepStretch')
                        : t('quickTemplates.jointMobility')}
              </p>
              <p className="mt-0.5 text-[0.6rem] text-muted">
                {tpl.id === 'full-body-express'
                  ? t('quickTemplates.fullBodyExpressDesc')
                  : tpl.id === 'core-express'
                    ? t('quickTemplates.coreExpressDesc')
                    : tpl.id === 'full-body-stretch'
                      ? t('quickTemplates.fullBodyStretchDesc')
                      : tpl.id === 'pre-sleep-stretch'
                        ? t('quickTemplates.preSleepStretchDesc')
                        : t('quickTemplates.jointMobilityDesc')}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[0.55rem] text-muted">
                <Clock className="size-3" />
                <span>{tpl.totalMinutes} min</span>
                <span>·</span>
                <span>{tpl.exercises.length} ejercicios</span>
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
          </div>
        ))}
      </div>
    </div>
  )
}
