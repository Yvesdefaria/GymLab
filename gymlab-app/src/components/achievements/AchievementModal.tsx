// Modal de logros (F95.1): cola secuencial — un solo logro por pantalla y
// avance dirigido por el usuario (botón, Escape o clic fuera). Celebración
// ampliada por ítem (confeti denso, haptics, pulse de la medalla) que bajo
// prefers-reduced-motion queda inerte: confeti estático visible, sin vibración
// ni animación. Cuando el logro actual acaba de re-lograr una variante de
// chapa, la medalla la muestra y se anuncia «Nueva variante desbloqueada».
import { useEffect, useRef, useState } from 'react'
import anime from 'animejs'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape'
import {
  confetti,
  CONFETTI_PIECES,
  CONFETTI_STAGGER,
  popScale,
  prefersReducedMotion,
} from '@/lib/animations'
import { haptics } from '@/lib/haptics'
import { AchievementMedal } from '@/components/achievements/AchievementMedal'
import type { Achievement, Collectible } from '@/domain/achievements'

const CONFETTI_COLORS = ['#D9B384', '#E8C9A0', '#7A6A5A', '#F2E8DC']

interface AchievementModalProps {
  achievements: Achievement[]
  onClose: () => void
  counts: Record<string, number>
  /** Variantes concedidas en este desbloqueo (re-logros), por id de logro. */
  newGranted: Collectible[]
}

export const AchievementModal = ({ achievements, onClose, counts, newGranted }: AchievementModalProps) => {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const pulseRef = useRef<anime.AnimeInstance | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const confettiRef = useRef<HTMLDivElement | null>(null)
  const medalWrapRef = useRef<HTMLSpanElement | null>(null)
  const closeBtnRef = useRef<HTMLSpanElement | null>(null)

  const total = achievements.length
  const current = achievements[index]!
  const isLast = index === total - 1
  const variant = newGranted.find((c) => c.achievementId === current.id)?.variantId

  // Avance dirigido por el usuario: siguiente ítem de la cola o cierre al final.
  // Los haptics viven aquí y no en el efecto de celebración: el primer ítem se
  // abre solo tras una sesión, y el navegador bloquea navigator.vibrate sin
  // gesto de usuario (botón, Escape o backdrop, todos gestos). El helper
  // unificado aplica además reduced-motion.
  const advance = () => {
    haptics([30, 40, 30])
    if (isLast) {
      onClose()
    } else {
      setIndex((i) => i + 1)
    }
  }

  // Apertura: foco inicial en la acción principal y pop del botón (una sola vez).
  useEffect(() => {
    if (closeBtnRef.current) popScale(closeBtnRef.current, { delay: 250 })
    closeBtnRef.current?.querySelector('button')?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Celebración por ítem de la cola. Reduced-motion: nada se anima ni vibra;
  // el confeti queda estático pero visible (opacity .35) para no perder la
  // ráfaga como contenido.
  useEffect(() => {
    if (confettiRef.current) {
      const pieces = [...confettiRef.current.children] as HTMLElement[]
      if (prefersReducedMotion()) {
        for (const p of pieces) p.style.opacity = '0.35'
      } else {
        // Sin haptics aquí: vibrate solo en advance() (gesto de usuario).
        confetti(pieces, CONFETTI_COLORS, { duration: 1100, stagger: CONFETTI_STAGGER })
      }
    }
    if (medalWrapRef.current && !prefersReducedMotion()) {
      pulseRef.current?.pause()
      pulseRef.current = anime({
        targets: medalWrapRef.current,
        scale: [1, 1.08, 1],
        duration: 1100,
        easing: 'easeInOutSine',
        loop: true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // Escape también avanza la cola (y cierra en el último ítem).
  useCloseOnEscape(advance)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop con blur; clic fuera avanza la cola. */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={advance}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-modal-title"
        className="relative w-full max-w-sm rounded-2xl border border-border bg-bg-soft/95 p-5 text-center shadow-2xl"
      >
        {/* Confeti ampliado: 28 piezas que caen de la medalla en ráfaga. */}
        <div
          ref={confettiRef}
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          {Array.from({ length: CONFETTI_PIECES }).map((_, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 size-1.5 rounded-[1px]"
              style={{
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                opacity: 0,
              }}
            />
          ))}
        </div>

        {/* Medalla como pieza central: variante de chapa + contador de veces. */}
        <span ref={medalWrapRef} className="inline-block">
          <AchievementMedal
            achievement={current}
            unlocked
            count={counts[current.id] ?? 0}
            variant={variant}
          />
        </span>

        <h2 id="achievement-modal-title" className="mt-3 font-display text-xl font-semibold text-fg">
          {t(current.titleKey as any)}
        </h2>
        <p className="mt-1 text-sm text-muted">{t(current.descriptionKey as any)}</p>

        {variant && (
          <span
            data-new-variant
            className="mt-3 inline-block rounded-full bg-cta/15 px-3 py-1 text-xs font-semibold text-cta"
          >
            {t('achievements.newVariant')}
          </span>
        )}

        {total > 1 && (
          <span
            data-queue-progress
            aria-live="polite"
            className="mt-3 block text-xs text-muted"
          >
            {t('achievements.queue.progress', { current: index + 1, total })}
          </span>
        )}

        <span ref={closeBtnRef} className="mt-5 block">
          <Button variant="primary" size="md" className="w-full" onClick={advance}>
            {t('achievements.genial')}
          </Button>
        </span>
      </div>
    </div>
  )
}