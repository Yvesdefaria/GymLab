// Botón «?» que abre un popover flotante con una breve explicación.
// Dos vías: `id` del catálogo central (HELP) con `values` para interpolar, o
// `label` + children para contenido dinámico (guías por zona/pliegue).
// Se posiciona con `position: fixed` y se recalcula al hacer scroll/resize para
// que quepa siempre dentro del viewport. Al abrir, el foco pasa al botón de
// cerrar; al cerrar con Escape o con la X, vuelve al disparador.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleHelp, X } from 'lucide-react'
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape'
import { HELP, type HelpId, type HelpValues } from '@/i18n/help'
import { computePopoverPos } from './popoverPosition'

type CatalogProps = { id: HelpId; values?: HelpValues }
type LegacyProps = { label: string; children: ReactNode }

type InfoTipProps = { className?: string } & (CatalogProps | LegacyProps)

export const InfoTip = (props: InfoTipProps) => {
  const { t } = useTranslation()
  const { className = '' } = props
  const isCatalog = 'id' in props
  const label = isCatalog ? t(HELP[props.id].label) : props.label
  const body = isCatalog ? t(HELP[props.id].body, props.values) : props.children

  const popoverId = useId()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null)

  // Cierra el popover; `restoreFocus` solo cuando el cierre fue por teclado o X
  // (un tap afuera ya movió el foco a donde el usuario tocó).
  const close = (restoreFocus: boolean) => {
    if (restoreFocus && open) triggerRef.current?.focus()
    setOpen(false)
  }

  useCloseOnEscape(() => close(true), 'document')

  // Mientras está abierto: recalcula la posición (scroll/resize) y cierra con clic fuera.
  useEffect(() => {
    if (!open) return
    const update = () => {
      const rect = rootRef.current?.getBoundingClientRect()
      if (rect) setPos(computePopoverPos(rect, { width: window.innerWidth, height: window.innerHeight }))
    }
    update()
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false)
    }
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  // Al abrir, el foco entra al diálogo (el lector de pantalla lo anuncia).
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => closeRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-label={label}
        className={`relative inline-flex size-6 items-center justify-center rounded-full border border-border text-muted transition-colors after:absolute after:-inset-2.5 after:content-[''] hover:border-cta hover:text-accent-soft ${className}`}
      >
        <CircleHelp className="size-4" aria-hidden />
      </button>
      {open && pos && (
        <div
          id={popoverId}
          role="dialog"
          aria-label={label}
          style={{ top: pos.top, left: pos.left, maxHeight: pos.maxHeight }}
          className="fixed z-50 w-64 scrollbar-hidden overflow-y-auto rounded-xl border border-border bg-bg-elevated p-3 pr-11 text-xs leading-relaxed text-muted shadow-lg shadow-black/30"
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => close(true)}
            aria-label={t('layout.confirm.close')}
            className="absolute right-1 top-1 inline-flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:text-fg"
          >
            <X className="size-4" aria-hidden />
          </button>
          {body}
        </div>
      )}
    </div>
  )
}
