// F101: tour guiado de la app — atenúa la pantalla, resalta el ancla del paso
// (data-tour) y muestra el globo con la explicación. Navega solo entre secciones.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape'
import { useMetaValue } from '@/hooks/useMetaValue'
import { metaRepo } from '@/data/repositories'
import {
  markSectionsSeen,
  SECTION_TIPS_SEEN_META_KEY,
  TOUR_COVERED_SECTIONS,
  TOUR_DONE_META_KEY,
  TOUR_PENDING_META_KEY,
  type SectionTipsSeen,
} from '@/domain/tour'
import { TOUR_STEPS } from '@/i18n/tour'
import { useTourStore } from '@/store/tourStore'
import { useTourAnchor } from './useTourAnchor'

// Alto estimado del globo para decidir si va arriba o abajo del ancla.
const BUBBLE_EST_HEIGHT = 210
const BUBBLE_WIDTH = 320
const GAP = 12
const EDGE = 16

export const TourOverlay = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const source = useTourStore((s) => s.source)
  const close = useTourStore((s) => s.close)
  const seen = useMetaValue<SectionTipsSeen>(SECTION_TIPS_SEEN_META_KEY, {})
  const [stepIndex, setStepIndex] = useState(0)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  const open = source !== null
  const step = TOUR_STEPS[Math.min(stepIndex, TOUR_STEPS.length - 1)]
  const isLast = stepIndex === TOUR_STEPS.length - 1
  const rect = useTourAnchor(step.anchor, step.id, open)

  // Al abrir: recuerda el foco previo y arranca del paso 1.
  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setStepIndex(0)
  }, [open])

  // Foco devuelto al cerrar (una sola vez por apertura).
  useEffect(() => {
    if (!open) return
    return () => restoreRef.current?.focus?.()
  }, [open])

  // Guiado: cada paso navega a su ruta; el ancla se espera en useTourAnchor.
  useEffect(() => {
    if (open) navigate(step.route)
  }, [open, step.route, navigate])

  // Foco al globo en cada paso (el texto se anuncia por aria-live).
  useEffect(() => {
    if (open) bubbleRef.current?.focus()
  }, [open, stepIndex])

  // Cerrar es terminal: marcado visto y el pendiente se apaga (idempotente en replay).
  // Saltar no marca secciones cubiertas; terminar el recorrido sí.
  const endTour = async (markCovered: boolean) => {
    await metaRepo.setJson(TOUR_DONE_META_KEY, true)
    await metaRepo.setJson(TOUR_PENDING_META_KEY, false)
    if (markCovered) {
      await metaRepo.setJson(SECTION_TIPS_SEEN_META_KEY, markSectionsSeen(seen, TOUR_COVERED_SECTIONS))
    }
    close()
  }

  const handleSkip = () => {
    if (open) void endTour(false)
  }
  useCloseOnEscape(handleSkip, 'document')

  const handleFinish = () => {
    void endTour(true).then(() => navigate('/'))
  }

  // Globo debajo del ancla si hay espacio; si no, arriba; clamp lateral.
  const bubbleStyle = useMemo(() => {
    if (!rect) return undefined
    const width = Math.min(BUBBLE_WIDTH, window.innerWidth - EDGE * 2)
    const below = rect.top + rect.height + GAP + BUBBLE_EST_HEIGHT <= window.innerHeight - EDGE
    const top = below ? rect.top + rect.height + GAP : Math.max(EDGE, rect.top - GAP - BUBBLE_EST_HEIGHT)
    const left = Math.min(Math.max(rect.left, EDGE), Math.max(EDGE, window.innerWidth - width - EDGE))
    return { top, left, width }
  }, [rect])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[140]" role="dialog" aria-modal="true" aria-label={t('tour.ui.aria')}>
      {rect ? (
        // Spotlight: rect transparente con una sombra gigante que oscurece el resto.
        <div
          aria-hidden
          data-testid="tour-spotlight"
          className="pointer-events-none absolute rounded-2xl transition-[top,left,width,height] duration-200 ease-out"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
            outline: '2px solid rgba(217, 179, 132, 0.85)',
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-black/70" />
      )}

      <div
        ref={bubbleRef}
        tabIndex={-1}
        className={`absolute outline-none ${rect ? '' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}`}
        style={bubbleStyle ?? { width: 'min(20rem, calc(100vw - 2rem))' }}
      >
        <div className="panel rounded-2xl border border-border p-4 shadow-2xl">
          <p aria-live="polite" className="text-sm leading-relaxed text-fg">
            {t(step.bodyKey)}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-muted">
              {t('tour.ui.step', { current: stepIndex + 1, total: TOUR_STEPS.length })}
            </span>
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <Button variant="outline" size="sm" onClick={() => setStepIndex((i) => i - 1)}>
                  {t('tour.ui.prev')}
                </Button>
              )}
              <Button size="sm" onClick={isLast ? handleFinish : () => setStepIndex((i) => i + 1)}>
                {isLast ? t('tour.ui.finish') : t('tour.ui.next')}
              </Button>
            </div>
          </div>
          <div className="mt-1 text-right">
            <button
              type="button"
              onClick={handleSkip}
              className="min-h-[44px] px-2 text-xs text-muted underline transition-colors hover:text-accent-soft"
            >
              {t('tour.ui.skip')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
