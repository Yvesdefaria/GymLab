// Botón «?» que abre un popover flotante con una breve explicación.
// Se posiciona con `position: fixed` y se recalcula al hacer scroll/resize para que
// quepa siempre dentro del viewport (útil cuando el botón está a mitad de página).
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CircleHelp } from 'lucide-react'

type InfoTipProps = {
  label: string
  children: ReactNode
  className?: string
}

const POPOVER_W = 256
const GAP = 8
const EDGE = 8

export const InfoTip = ({ label, children, className = '' }: InfoTipProps) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; maxH: number } | null>(null)

  // Calcula top/left (fixed) y la altura máxima para que el popover no se corte.
  const computePos = () => {
    const rect = rootRef.current?.getBoundingClientRect()
    if (!rect) return null
    const vw = window.innerWidth
    const vh = window.innerHeight
    const maxH = Math.min(320, vh - 2 * EDGE)
    const left =
      rect.right + GAP + POPOVER_W <= vw - EDGE
        ? rect.right + GAP
        : rect.left - GAP - POPOVER_W >= EDGE
          ? rect.left - GAP - POPOVER_W
          : Math.min(Math.max(rect.left, EDGE), vw - POPOVER_W - EDGE)
    const top =
      rect.bottom + GAP + maxH <= vh - EDGE
        ? rect.bottom + GAP
        : rect.top - GAP - maxH >= EDGE
          ? rect.top - GAP - maxH
          : Math.min(Math.max(rect.top, EDGE), vh - maxH - EDGE)
    return { top, left, maxH }
  }

  // Mientras está abierto: recalcula la posición (scroll/resize) y cierra con Esc o clic fuera.
  useEffect(() => {
    if (!open) return
    const update = () => setPos(computePos())
    update()
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={label}
        className={`inline-flex size-6 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-cta hover:text-accent-soft ${className}`}
      >
        <CircleHelp className="size-4" aria-hidden />
      </button>
      {open && pos && (
        <div
          role="dialog"
          aria-label={label}
          style={{ top: pos.top, left: pos.left, maxHeight: pos.maxH }}
          className="fixed z-50 w-64 scrollbar-hidden overflow-y-auto rounded-xl border border-border bg-bg-elevated p-3 text-xs leading-relaxed text-muted shadow-lg shadow-black/30"
        >
          {children}
        </div>
      )}
    </div>
  )
}
