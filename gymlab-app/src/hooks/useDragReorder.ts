// Reordenar por arrastre con puntero: estado + handlers sin lógica de datos (la resuelve el padre vía callbacks).
// Optimización de rendimiento: un solo apply por frame (rAF) y setDragOver solo cuando cambia el objetivo.
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseDragReorderOptions {
  getItemCount: (dayIndex: number) => number
  onReorder: (dayIndex: number, fromIndex: number, toIndex: number) => void
}

export const useDragReorder = ({ getItemCount, onReorder }: UseDragReorderOptions) => {
  const dragRef = useRef<{ dayIndex: number; fromIndex: number; startY: number } | null>(null)
  const [dragOver, setDragOver] = useState<{ dayIndex: number; toIndex: number } | null>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  // Último objetivo aplicado: permite saltar setDragOver si no cambió (bailout de re-render).
  const dragTargetRef = useRef<{ dayIndex: number; toIndex: number } | null>(null)
  // Última posición de puntero pendiente de aplicar + id del frame programado.
  const pendingMoveRef = useRef<{ dayIndex: number; clientY: number } | null>(null)
  const rafRef = useRef<number | null>(null)

  const getItemCountRef = useRef(getItemCount)
  getItemCountRef.current = getItemCount
  const onReorderRef = useRef(onReorder)
  onReorderRef.current = onReorder

  const registerItemRef = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) itemRefs.current.set(key, el)
    else itemRefs.current.delete(key)
  }, [])

  // Aplica la última posición pendiente del frame. El hit-test es idéntico al original
  // (misma semántica de thresholds); solo se ejecuta una vez por frame y no por evento.
  const applyPendingMove = useCallback(() => {
    rafRef.current = null
    const pending = pendingMoveRef.current
    if (!pending) return
    pendingMoveRef.current = null
    const drag = dragRef.current
    if (!drag || drag.dayIndex !== pending.dayIndex) return
    const count = getItemCountRef.current(pending.dayIndex)
    let toIndex = count - 1
    for (let i = 0; i < count; i++) {
      const el = itemRefs.current.get(`${pending.dayIndex}-${i}`)
      if (!el) continue
      // Lectura fresca por frame (no cacheada): si el contenedor hace scroll durante el
      // arrastre, el rect actual decide el objetivo igual que antes, sin cambiar qué item se pisa.
      const rect = el.getBoundingClientRect()
      if (pending.clientY < rect.top + rect.height / 2) {
        toIndex = i
        break
      }
    }
    const next = { dayIndex: pending.dayIndex, toIndex }
    const prev = dragTargetRef.current
    if (prev && prev.dayIndex === next.dayIndex && prev.toIndex === next.toIndex) return
    dragTargetRef.current = next
    setDragOver(next)
  }, [])

  const onDragStart = useCallback((dayIndex: number, fromIndex: number, e: React.PointerEvent) => {
    e.preventDefault()
    dragRef.current = { dayIndex, fromIndex, startY: e.clientY }
    dragTargetRef.current = null
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onDragMove = useCallback((dayIndex: number, e: React.PointerEvent) => {
    if (!dragRef.current || dragRef.current.dayIndex !== dayIndex) return
    pendingMoveRef.current = { dayIndex, clientY: e.clientY }
    // Un solo frame pendiente: los movimientos del mismo frame se resuelven con la última posición.
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(applyPendingMove)
    }
  }, [applyPendingMove])

  const onDragEnd = useCallback(() => {
    const drag = dragRef.current
    if (drag) {
      // Antes de soltar se aplica la última posición pendiente: el destino del drop
      // coincide con la posición final del puntero (semántica original, sin frames perdidos).
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        applyPendingMove()
      }
      const target = dragTargetRef.current
      if (target && drag.fromIndex !== target.toIndex) {
        onReorderRef.current(drag.dayIndex, drag.fromIndex, target.toIndex)
      }
    }
    dragRef.current = null
    dragTargetRef.current = null
    setDragOver(null)
  }, [applyPendingMove])

  // Cancela el frame pendiente si el builder se desmonta a mitad de un arrastre.
  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    },
    []
  )

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