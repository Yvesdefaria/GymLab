// Cierre "de sistema" de un overlay: Escape y botón back físico de Android.
// Unifica ambos gestos en un solo punto para que un sheet/modal no se pueda cerrar
// de una forma y de la otra no (F134/T1).
// `open` es obligatorio de respetar por los overlays que quedan montados y se ocultan
// con un flag: un overlay cerrado no debe consumir el back ni el Escape.
import { useOverlayBack } from '@/hooks/useOverlayBack'
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape'

export const useOverlayDismiss = (
  onClose: () => void,
  open = true,
  target: 'window' | 'document' = 'window'
): void => {
  useCloseOnEscape(onClose, target, open)
  useOverlayBack(open, onClose)
}
