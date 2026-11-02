// Cierra un overlay con el botón back físico de Android (F134/T1).
// `onClose` vive en una ref para no re-registrar el handler cuando el caller pasa
// una arrow inline: re-registrar en cada render alteraría el orden LIFO y, con dos
// overlays abiertos, el back cerraría el equivocado.
import { useEffect, useRef } from 'react'
import { registerBackHandler } from '@/lib/backHandlers'

export const useOverlayBack = (isOpen: boolean, onClose: () => void) => {
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return undefined
    return registerBackHandler(() => {
      closeRef.current()
      return true
    })
  }, [isOpen])
}
