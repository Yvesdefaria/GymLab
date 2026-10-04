// En táctil el motor web muestra un menú nativo con la URL interna (http://localhost/…) al
// mantener pulsado un <a>. Se cancela `contextmenu` SOLO sobre links y SOLO con puntero
// coarse, así el clic derecho de desktop y la selección de texto normal quedan intactos.

let initialized = false

export const handleLinkContextMenu = (event: MouseEvent) => {
  // Sin matchMedia (p. ej. entornos sin DOM completo) no hay nada que suprimir.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
  if (!window.matchMedia('(pointer: coarse)').matches) return
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
