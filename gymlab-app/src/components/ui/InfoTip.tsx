// Botón «?» que abre un popover flotante con una breve explicación.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CircleHelp } from 'lucide-react'

type InfoTipProps = {
  label: string
  children: ReactNode
  className?: string
}

export const InfoTip = ({ label, children, className = '' }: InfoTipProps) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Cierra al pulsar fuera o con Escape; se mantiene abierto al hacer scroll (drag-scroll).
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
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
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute left-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-bg-elevated p-3 text-xs leading-relaxed text-muted shadow-lg shadow-black/30"
        >
          {children}
        </div>
      )}
    </div>
  )
}
