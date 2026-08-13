// Toast flotante para deshacer la última eliminación durante una sesión activa.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Undo2 } from 'lucide-react'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useSettings } from '@/hooks/useSettings'

// Se auto-oculta cuando caduca el temporizador configurado en ajustes.
export const UndoToast = () => {
  const { t } = useTranslation()
  const undoStack = useActiveWorkoutStore((s) => s.undoStack)
  const undo = useActiveWorkoutStore((s) => s.undo)
  const clearUndo = useActiveWorkoutStore((s) => s.clearUndo)
  const { settings } = useSettings()
  const [visible, setVisible] = useState(false)
  const last = undoStack[undoStack.length - 1]

  // Muestra el toast al llegar un nuevo elemento a la pila y programa su expiración.
  useEffect(() => {
    if (!last) {
      setVisible(false)
      return
    }
    setVisible(true)
    const dur = settings.undoDurationSec
    if (dur <= 0) return
    const t = setTimeout(() => {
      clearUndo()
      setVisible(false)
    }, dur * 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last?.ts, settings.undoDurationSec])

  if (!visible || !last) return null

  const handleUndo = () => {
    const ok = undo()
    // Si ya no queda nada que deshacer, esconde el toast.
    if (!ok) setVisible(false)
  }

  return (
    <div className="fixed inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom)+0.75rem)] z-[90]">
      <div
        role="status"
        className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-gold/60 bg-bg-elevated/95 px-4 py-3 shadow-xl backdrop-blur"
      >
        <p className="min-w-0 truncate text-sm text-fg">
          <span className="text-muted">{t('layout.undo.eliminated')}</span> {last.label}
        </p>
        <button
          onClick={handleUndo}
          className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-lg border border-cta/50 bg-cta/20 px-3 text-xs font-semibold text-accent-soft"
        >
          <Undo2 className="size-4" />
          {t('layout.undo.undo')}
        </button>
      </div>
    </div>
  )
}
