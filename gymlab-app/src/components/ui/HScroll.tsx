// Contenedor de scroll horizontal con soporte de arrastre con ratón/dedo (drag-to-scroll).
import type { ReactNode } from 'react'
import { useDragToScroll } from '@/hooks/useDragToScroll'

// Envuelve hijos en una fila scrolleable; mantiene el pan táctil y oculta la barra de scroll.
export const HScroll = ({ className = '', children }: { className?: string; children: ReactNode }) => {
  // Los handlers del hook evitan que un arrastre dispare clics en los elementos internos.
  const drag = useDragToScroll()

  return (
    <div
      ref={drag.ref}
      onPointerDown={drag.onPointerDown}
      onClickCapture={drag.onClickCapture}
      className={`scrollbar-hidden flex cursor-grab touch-pan-x select-none gap-2 overflow-x-auto active:cursor-grabbing ${className}`}
    >
      {children}
    </div>
  )
}
