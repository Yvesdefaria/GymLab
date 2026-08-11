// Hoja de confirmación tipo bottom-sheet: sustituye a window.confirm con el lenguaje visual del tema.
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { ReactNode } from 'react'

type Props = {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Diálogo modal accesible (role="alertdialog") con CTA de confirmación y cierre por Escape o backdrop.
export const ConfirmSheet = ({
  title,
  message,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) => {
  // Cierra con la tecla Escape como alternativa a tocar fuera del panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="panel-floating w-full max-w-md p-5 sm:rounded-3xl"
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-fg">{title}</h2>
          <button
            onClick={onCancel}
            disabled={busy}
            aria-label="Cerrar"
            className="relative flex size-10 items-center justify-center rounded-xl border border-border text-muted after:absolute after:-inset-1 after:content-[''] hover:text-fg disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="text-sm leading-relaxed text-muted">{message}</div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="outline" size="md" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
