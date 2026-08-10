// Modal de logro desbloqueado: aparece al completar sesión/PR/racha con confeti,
// icono con pulse en loop y botón «¡Genial!». Accesible (role=dialog, foco
// inicial, Escape para cerrar) y respeta prefers-reduced-motion.
import { useEffect, useRef } from 'react'
import anime from 'animejs'
import {
  BarChart3,
  CalendarCheck,
  Crown,
  Flame,
  Footprints,
  Repeat,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { confetti, popScale, prefersReducedMotion } from '@/lib/animations'
import type { Achievement } from '@/domain/achievements'

// Mapa de iconos por clave de logro (constantes del dominio, sin input de usuario).
const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  Footprints,
  Trophy,
  Flame,
  Crown,
  Target,
  BarChart3,
  CalendarCheck,
  Repeat,
}

const CONFETTI_COLORS = ['#D9B384', '#E8C9A0', '#7A6A5A', '#F2E8DC']

interface AchievementModalProps {
  achievements: Achievement[]
  onClose: () => void
}

export const AchievementModal = ({ achievements, onClose }: AchievementModalProps) => {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const iconRef = useRef<HTMLSpanElement | null>(null)
  const confettiRef = useRef<HTMLDivElement | null>(null)
  const closeBtnRef = useRef<HTMLSpanElement | null>(null)

  // Animaciones de entrada: confeti, pulse en loop del icono y popScale del botón.
  useEffect(() => {
    if (confettiRef.current) {
      confetti([...confettiRef.current.children] as HTMLElement[], CONFETTI_COLORS, { duration: 1100 })
    }
    if (iconRef.current && !prefersReducedMotion()) {
      anime({
        targets: iconRef.current,
        scale: [1, 1.08, 1],
        duration: 1100,
        easing: 'easeInOutSine',
        loop: true,
      })
    }
    if (closeBtnRef.current) popScale(closeBtnRef.current, { delay: 250 })
    // Foco inicial en el botón principal del diálogo.
    closeBtnRef.current?.querySelector('button')?.focus()
  }, [])

  // Cierra con Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop con blur; clic fuera cierra el modal. */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-modal-title"
        className="relative w-full max-w-sm rounded-2xl border border-border bg-bg-soft/95 p-5 text-center shadow-2xl"
      >
        {/* Confeti ligero: piezas que caen y se desvanecen al abrir. */}
        <div
          ref={confettiRef}
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          {Array.from({ length: 12 }).map((_, i) => (
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

        <span
          ref={iconRef}
          className="mx-auto flex size-16 items-center justify-center rounded-full bg-cta/15 text-cta"
        >
          {(() => {
            const Icon = ACHIEVEMENT_ICONS[achievements[0].icon] ?? Trophy
            return <Icon className="size-8" aria-hidden />
          })()}
        </span>

        <h2 id="achievement-modal-title" className="mt-3 font-display text-xl font-semibold text-fg">
          ¡Logro desbloqueado!
        </h2>

        <ul className="mt-3 space-y-3 text-left">
          {achievements.map((a) => {
            const Icon = ACHIEVEMENT_ICONS[a.icon] ?? Trophy
            return (
              <li key={a.id} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-cta/15 text-cta">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-fg">{a.title}</span>
                  <span className="block text-xs text-muted">{a.description}</span>
                </span>
              </li>
            )
          })}
        </ul>

        <span ref={closeBtnRef} className="mt-5 block">
          <Button variant="primary" size="md" className="w-full" onClick={onClose}>
            ¡Genial!
          </Button>
        </span>
      </div>
    </div>
  )
}
