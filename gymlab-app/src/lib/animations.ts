// Helpers de animación con anime.js v4.
// Todos respetan `prefers-reduced-motion`: si el usuario lo pide, no se anima
// y se aplica directamente el estado final (evita que .anime-ready deje
// elementos invisibles o que drawOn deje trazados sin dibujar).

import { animate, stagger, utils, type AnimationParams, type JSAnimation } from 'animejs'

type AnimeInstance = JSAnimation
// v4 acepta selectores, elementos, NodeLists o colecciones; el tipo local se
// ancla al de `animate` para no duplicar la unión del SDK.
type AnimeTarget = Parameters<typeof animate>[0]

// True si el SO/navegador pide reducir el movimiento.
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Aplica el estado final sin animación (usado por el guard de reduced-motion).
const settle = (targets: AnimeTarget, props: { opacity?: number; transform?: string }): void => {
  const els = Array.isArray(targets) ? targets : [targets]
  for (const t of els) {
    if (!(t instanceof Element)) continue
    if (props.opacity !== undefined) (t as HTMLElement).style.opacity = String(props.opacity)
    if (props.transform !== undefined) (t as HTMLElement).style.transform = props.transform
  }
}

export interface AnimationOptions {
  duration?: number
  delay?: number
  easing?: string
  onComplete?: () => void
}

const defaults: Required<Pick<AnimationOptions, 'duration' | 'easing'>> = {
  duration: 300,
  easing: 'outCubic',
}

// v4: `onComplete: undefined` explícito no satisface `AnimationParams` (la index
// signature del Record no incluye undefined); se asigna después de construir los
// params y solo cuando existe.
const withComplete = (params: AnimationParams, onComplete?: () => void): AnimationParams => {
  if (onComplete) params.onComplete = onComplete
  return params
}

export const fadeIn = (targets: AnimeTarget, options: AnimationOptions = {}): AnimeInstance | null => {
  const duration = options.duration ?? defaults.duration
  if (prefersReducedMotion()) {
    settle(targets, { opacity: 1 })
    options.onComplete?.()
    return null
  }
  return animate(
    targets,
    withComplete(
      {
        opacity: [0, 1],
        duration,
        delay: options.delay ?? 0,
        ease: options.easing ?? defaults.easing,
      },
      options.onComplete,
    ),
  )
}

export type SlideDirection = 'left' | 'right' | 'up' | 'down'

const slideOffset: Record<SlideDirection, string> = {
  left: '-24px',
  right: '24px',
  up: '-16px',
  down: '16px',
}

const slideTransform = (direction: SlideDirection, from: boolean): string => {
  const offset = slideOffset[direction]
  const value = from ? offset : '0px'
  if (direction === 'left' || direction === 'right') return `translateX(${value})`
  return `translateY(${value})`
}

// Parámetros de animación para slideIn/slideOut/staggerSlide (in: [offset,0], out: [0,offset]).
const slideAnimParams = (
  direction: SlideDirection,
  entrando: boolean,
): { translateX: [string, string] | number; translateY: [string, string] | number } => {
  const delta: [string, string] = entrando ? [slideOffset[direction], '0px'] : ['0px', slideOffset[direction]]
  return {
    translateX: direction === 'left' || direction === 'right' ? delta : 0,
    translateY: direction === 'up' || direction === 'down' ? delta : 0,
  }
}

export const slideIn = (targets: AnimeTarget, direction: SlideDirection, options: AnimationOptions = {}): AnimeInstance | null => {
  const duration = options.duration ?? defaults.duration
  if (prefersReducedMotion()) {
    settle(targets, { opacity: 1, transform: 'translate(0, 0)' })
    options.onComplete?.()
    return null
  }
  return animate(
    targets,
    withComplete(
      {
        opacity: [0, 1],
        ...slideAnimParams(direction, true),
        duration,
        delay: options.delay ?? 0,
        ease: options.easing ?? defaults.easing,
      },
      options.onComplete,
    ),
  )
}

export const slideOut = (targets: AnimeTarget, direction: SlideDirection, options: AnimationOptions = {}): AnimeInstance | null => {
  const duration = options.duration ?? defaults.duration
  if (prefersReducedMotion()) {
    settle(targets, { opacity: 0, transform: slideTransform(direction, true) })
    options.onComplete?.()
    return null
  }
  return animate(
    targets,
    withComplete(
      {
        opacity: [1, 0],
        ...slideAnimParams(direction, false),
        duration,
        delay: options.delay ?? 0,
        ease: options.easing ?? defaults.easing,
      },
      options.onComplete,
    ),
  )
}

export const staggerFade = (targets: AnimeTarget, options: AnimationOptions & { staggerDelay?: number } = {}): AnimeInstance | null => {
  const duration = options.duration ?? defaults.duration
  const step = options.staggerDelay ?? 40
  if (prefersReducedMotion()) {
    settle(targets, { opacity: 1 })
    options.onComplete?.()
    return null
  }
  return animate(
    targets,
    withComplete(
      {
        opacity: [0, 1],
        duration,
        delay: stagger(step, { start: options.delay ?? 0 }),
        ease: options.easing ?? defaults.easing,
      },
      options.onComplete,
    ),
  )
}

export const staggerSlide = (
  targets: AnimeTarget,
  direction: SlideDirection,
  options: AnimationOptions & { staggerDelay?: number } = {},
): AnimeInstance | null => {
  const duration = options.duration ?? defaults.duration
  const step = options.staggerDelay ?? 50
  if (prefersReducedMotion()) {
    settle(targets, { opacity: 1, transform: 'translate(0, 0)' })
    options.onComplete?.()
    return null
  }
  return animate(
    targets,
    withComplete(
      {
        opacity: [0, 1],
        ...slideAnimParams(direction, true),
        duration,
        delay: stagger(step, { start: options.delay ?? 0 }),
        ease: options.easing ?? defaults.easing,
      },
      options.onComplete,
    ),
  )
}

export const popScale = (targets: AnimeTarget, options: AnimationOptions = {}): AnimeInstance | null => {
  const duration = options.duration ?? 350
  if (prefersReducedMotion()) {
    settle(targets, { opacity: 1, transform: 'scale(1)' })
    options.onComplete?.()
    return null
  }
  return animate(
    targets,
    withComplete(
      {
        opacity: [0, 1],
        scale: [0.6, 1.05, 1],
        duration,
        delay: options.delay ?? 0,
        ease: 'outCubic',
      },
      options.onComplete,
    ),
  )
}

export const pulse = (targets: AnimeTarget, options: AnimationOptions & { iterations?: number } = {}): AnimeInstance | null => {
  const duration = options.duration ?? 600
  const iterations = options.iterations ?? 3
  if (prefersReducedMotion()) return null
  return animate(
    targets,
    withComplete(
      {
        scale: [1, 1.12, 1],
        duration,
        // v4 cuenta REPETICIONES en `loop` (v3 contaba iteraciones totales):
        // se resta 1 para preservar las `iterations` visibles de siempre.
        loop: Math.max(0, iterations - 1),
        delay: options.delay ?? 0,
        ease: 'inOutSine',
      },
      options.onComplete,
    ),
  )
}

// Normaliza cualquier forma de target de v4 (selector CSS, Element, NodeList,
// HTMLCollection o array) a elementos DOM reales; el resto se descarta.
const resolveElements = (targets: AnimeTarget): Element[] => {
  if (typeof targets === 'string')
    return typeof document !== 'undefined' ? [...document.querySelectorAll(targets)] : []
  if (targets instanceof Element) return [targets]
  if (targets == null) return []
  return Array.from(targets as ArrayLike<unknown>).filter((t): t is Element => t instanceof Element)
}

// Dibuja el contorno de un path/circle/line SVG con stroke-dashoffset.
// v4 retiró `anime.setDashoffset`: acá se prepara el trazo por elemento
// (dasharray y offset inicial = longitud real del path) y la animación solo
// lleva el offset a 0 desde el valor actual. Los targets se normalizan a
// elementos reales, así selectores, NodeLists y colecciones siguen soportados.
export const drawOn = (targets: AnimeTarget, options: AnimationOptions = {}): AnimeInstance | null => {
  const duration = options.duration ?? 700
  const els = resolveElements(targets).filter(
    (t): t is SVGGeometryElement => 'getTotalLength' in t,
  )
  for (const el of els) {
    const length = el.getTotalLength()
    el.style.strokeDasharray = String(length)
    el.style.strokeDashoffset = String(length)
  }
  if (prefersReducedMotion()) {
    for (const el of els) el.style.strokeDashoffset = '0'
    options.onComplete?.()
    return null
  }
  return animate(
    els,
    withComplete(
      {
        strokeDashoffset: 0,
        duration,
        delay: options.delay ?? 0,
        ease: 'inOutSine',
      },
      options.onComplete,
    ),
  )
}

export const confetti = (target: AnimeTarget, colors: string[] = ['#D9B384', '#FDDDB4', '#22C55E', '#F8FAFC'], options: AnimationOptions & { stagger?: number } = {}): AnimeInstance | null => {
  const duration = options.duration ?? 900
  if (prefersReducedMotion()) {
    options.onComplete?.()
    return null
  }
  return animate(
    target,
    withComplete(
      {
        translateX: () => utils.random(-90, 90),
        translateY: () => utils.random(-120, 20),
        rotate: () => utils.random(-180, 180),
        scale: () => [1, utils.random(0.6, 1.2)],
        opacity: { to: [1, 0], ease: 'outQuad' },
        backgroundColor: () => colors[Math.floor(Math.random() * colors.length)],
        duration,
        delay: stagger(options.stagger ?? 18, { start: options.delay ?? 0 }),
        ease: 'outCubic',
      },
      options.onComplete,
    ),
  )
}

// Celebración ampliada del modal de logros (F95.1): 28 piezas repartidas
// uniformemente (360° / piezas) para una ráfaga más densa que la base.
export const CONFETTI_PIECES = 28
export const CONFETTI_STAGGER = Math.round(360 / CONFETTI_PIECES)

// Conveniencia: si el usuario pide reducir el movimiento, anime no anima,
// pero el estado base .anime-ready (opacity:0) lo deja invisible. Este helper
// limpia la clase para que nada quede oculto sin animación.
export const ensureVisible = (targets: AnimeTarget): void => {
  const els = Array.isArray(targets) ? targets : [targets]
  for (const t of els) {
    if (t instanceof Element) t.classList.remove('anime-ready')
  }
}
