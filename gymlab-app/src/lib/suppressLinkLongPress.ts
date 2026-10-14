// En táctil el motor web muestra un menú nativo con la URL interna (http://localhost/…) al
// mantener pulsado un <a>. Se cancela `contextmenu` SOLO sobre links. El gate es el puntero
// del propio EVENTO: mouse nunca cancela (clic derecho intacto aunque el dispositivo sea
// híbrido), touch/pen siempre cancelan, y sin `pointerType` (evento sintético o entorno
// viejo) se cae EXACTO al gate por dispositivo (`pointer: coarse`) de antes.

let initialized = false

export const handleLinkContextMenu = (event: MouseEvent) => {
  // Duck-typing: en node no existen los constructores DOM. `pointerType` solo viene en
  // PointerEvent; en MouseEvent sintéticos o navegadores viejos queda vacío/undefined.
  const pointerType = (event as PointerEvent).pointerType

  // El mouse manda sobre la media query: en híbridos el clic derecho no se toca.
  if (pointerType === 'mouse') return
  // lote 30 (R3-002): el lápiz distingue el botón del evento — el long-press con la punta
  // (button 0) se cancela; el botón secundario (contextmenu real, button 2/5) conserva su menú.
  if (pointerType === 'pen' && event.button !== 0) return

  if (pointerType !== 'touch' && pointerType !== 'pen') {
    // Fallback al comportamiento previo: sin matchMedia no hay nada que suprimir.
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    if (!window.matchMedia('(pointer: coarse)').matches) return
  }

  // Duck-typing en vez de instanceof: el evento puede traer un target no-HTMLElement
  // (o llegar desde un entorno de test en node, donde no existen los constructores DOM).
  const target = event.target as { closest?: (selector: string) => Element | null } | null
  if (!target || typeof target.closest !== 'function') return
  if (!target.closest('a')) return
  event.preventDefault()
}

export const initSuppressLinkLongPress = () => {
  if (typeof document === 'undefined') return
  // Idempotente: un segundo init no debe duplicar el listener.
  if (initialized) return
  initialized = true
  document.addEventListener('contextmenu', handleLinkContextMenu)
}
