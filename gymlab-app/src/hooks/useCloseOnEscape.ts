// Cierra un overlay/modal con la tecla Escape (lista keydown en window o document).
// `enabled` permite que un overlay montado pero cerrado no escuche (F134/T1).
import { useEffect } from 'react'

export const useCloseOnEscape = (
  onClose: () => void,
  target: 'window' | 'document' = 'window',
  enabled = true
): void => {
  useEffect(() => {
    if (!enabled) return
    const onKey: EventListener = (e) => {
      if ((e as KeyboardEvent).key === 'Escape') onClose()
    }
    const el: Window | Document = target === 'document' ? document : window
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [onClose, target, enabled])
}
