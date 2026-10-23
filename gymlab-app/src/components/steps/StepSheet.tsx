// Bottom sheet compartido de /pasos (dirección C): scrim, foco inicial, trampa de
// Tab, Escape y bloqueo del scroll del fondo. Sin botón de cierre visible: se
// cierra tocando el scrim, con Escape o con la acción Cancelar del contenido.
import { useEffect, useRef, type ReactNode } from 'react'
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape'

type StepSheetProps = {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

export const StepSheet = ({ open, title, subtitle, onClose, children }: StepSheetProps) => {
  const panelRef = useRef<HTMLDivElement>(null)
  useCloseOnEscape(onClose)

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusable = panel?.querySelector<HTMLElement>(FOCUSABLE)
    focusable?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !panel) return
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previous?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t border-gold/25 bg-bg p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-24px_60px_rgba(0,0,0,0.6)]"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-fg/20" aria-hidden />
        <h2 className="font-display text-xl font-normal text-fg">{title}</h2>
        {subtitle ? <p className="mt-1 text-[10px] text-muted">{subtitle}</p> : null}
        {children}
      </div>
    </div>
  )
}
