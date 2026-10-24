// Bottom sheet modal del catálogo: backdrop, Escape y foco inicial en el panel.
// Mismo patrón a11y que ConfirmSheet/RoutineDestinationSheet (sin focus trap).
import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape'

export const BottomSheet = ({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}) => {
  useCloseOnEscape(onClose)
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  // Foco inicial en el panel: el lector anuncia título y subtítulo al abrir.
  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t border-gold/25 bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-24px_60px_rgba(0,0,0,0.6)] focus:outline-none"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-fg/20" aria-hidden />
        <h2 id={titleId} className="font-display text-xl font-normal tracking-wide text-fg">
          {title}
        </h2>
        {subtitle ? <p className="mt-1 text-[10px] text-muted">{subtitle}</p> : null}
        {children}
      </div>
    </div>
  )
}
