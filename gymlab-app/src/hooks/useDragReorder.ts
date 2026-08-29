// Reordenar por arrastre con puntero: estado + handlers sin lógica de datos (la resuelve el padre vía callbacks).
import { useCallback, useRef, useState } from 'react'

interface UseDragReorderOptions {
  getItemCount: (dayIndex: number) => number
  onReorder: (dayIndex: number, fromIndex: number, toIndex: number) => void
}

export const useDragReorder = ({ getItemCount, onReorder }: UseDragReorderOptions) => {
  const dragRef = useRef<{ dayIndex: number; fromIndex: number; startY: number } | null>(null)
  const [dragOver, setDragOver] = useState<{ dayIndex: number; toIndex: number } | null>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const getItemCountRef = useRef(getItemCount)
  getItemCountRef.current = getItemCount
  const onReorderRef = useRef(onReorder)
  onReorderRef.current = onReorder

  const registerItemRef = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) itemRefs.current.set(key, el)
    else itemRefs.current.delete(key)
  }, [])

  const onDragStart = useCallback((dayIndex: number, fromIndex: number, e: React.PointerEvent) => {
    e.preventDefault()
    dragRef.current = { dayIndex, fromIndex, startY: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onDragMove = useCallback((dayIndex: number, e: React.PointerEvent) => {
    if (!dragRef.current || dragRef.current.dayIndex !== dayIndex) return
    const count = getItemCountRef.current(dayIndex)
    for (let i = 0; i < count; i++) {
      const el = itemRefs.current.get(`${dayIndex}-${i}`)
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (e.clientY < rect.top + rect.height / 2) {
        setDragOver({ dayIndex, toIndex: i })
        return
      }
    }
    setDragOver({ dayIndex, toIndex: count - 1 })
  }, [])

  const onDragEnd = useCallback(() => {
    const drag = dragRef.current
    if (drag && dragOver && drag.fromIndex !== dragOver.toIndex) {
      onReorderRef.current(drag.dayIndex, drag.fromIndex, dragOver.toIndex)
    }
    dragRef.current = null
    setDragOver(null)
  }, [dragOver])

  const isDragging = useCallback(
    (dayIndex: number, itemIndex: number) => {
      const drag = dragRef.current
      return Boolean(drag && drag.dayIndex === dayIndex && drag.fromIndex === itemIndex)
    },
    []
  )

  const isOver = useCallback(
    (dayIndex: number, itemIndex: number) =>
      Boolean(dragOver && dragOver.dayIndex === dayIndex && dragOver.toIndex === itemIndex),
    [dragOver]
  )

  return { registerItemRef, onDragStart, onDragMove, onDragEnd, isDragging, isOver }
}