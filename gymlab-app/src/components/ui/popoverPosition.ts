// Geometría pura del popover de InfoTip: calcula top/left (fixed) y la altura
// máxima para que quepa dentro del viewport, con flip y clamp. Extraído para
// poder testearlo sin DOM (el repo no tiene jsdom).
export const POPOVER_WIDTH = 256
export const POPOVER_MAX_HEIGHT = 320
export const POPOVER_GAP = 8
export const POPOVER_EDGE = 8

type Anchor = { top: number; right: number; bottom: number; left: number }
type Viewport = { width: number; height: number }

export type PopoverPosition = { top: number; left: number; maxHeight: number }

export const computePopoverPos = (anchor: Anchor, viewport: Viewport): PopoverPosition => {
  const { width: vw, height: vh } = viewport
  const maxHeight = Math.min(POPOVER_MAX_HEIGHT, vh - 2 * POPOVER_EDGE)
  const left =
    anchor.right + POPOVER_GAP + POPOVER_WIDTH <= vw - POPOVER_EDGE
      ? anchor.right + POPOVER_GAP
      : anchor.left - POPOVER_GAP - POPOVER_WIDTH >= POPOVER_EDGE
        ? anchor.left - POPOVER_GAP - POPOVER_WIDTH
        : Math.min(Math.max(anchor.left, POPOVER_EDGE), vw - POPOVER_WIDTH - POPOVER_EDGE)
  const top =
    anchor.bottom + POPOVER_GAP + maxHeight <= vh - POPOVER_EDGE
      ? anchor.bottom + POPOVER_GAP
      : anchor.top - POPOVER_GAP - maxHeight >= POPOVER_EDGE
        ? anchor.top - POPOVER_GAP - maxHeight
        : Math.min(Math.max(anchor.top, POPOVER_EDGE), vh - maxHeight - POPOVER_EDGE)
  return { top, left, maxHeight }
}
