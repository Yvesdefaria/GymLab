import type { ReactNode } from 'react'
import { useDragToScroll } from '@/hooks/useDragToScroll'

export const HScroll = ({ className = '', children }: { className?: string; children: ReactNode }) => {
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
