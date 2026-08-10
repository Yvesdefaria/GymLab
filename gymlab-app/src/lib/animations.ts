// Helpers de animación con anime.js v3.
// Todos respetan `prefers-reduced-motion`: si el usuario lo pide, no se anima
// y se aplica directamente el estado final (evita que .anime-ready deje
// elementos invisibles o que drawOn deje trazados sin dibujar).

import anime from 'animejs'

type AnimeInstance = anime.AnimeInstance
// animejs@3 acepta selectores, elementos, NodeLists o arrays; @types/animejs no
// exporta su tipo AnimeTarget (es de módulo), así que se replica aquí.
type AnimeTarget = string | object | HTMLElement | SVGElement | NodeList | null

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
  easing: 'easeOutCubic',
}

export const fadeIn = (targets: AnimeTarget, options: AnimationOptions = {}): AnimeInstance | null => {
  const duration = options.duration ?? defaults.duration
  if (prefersReducedMotion()) {
    settle(targets, { opacity: 1 })
    options.onComplete?.()
    return null
  }
  return anime({
    targets,
    opacity: [0, 1],
    duration,
    delay: options.delay ?? 0,
    easing: options.easing ?? defaults.easing,
    complete: options.onComplete,
  })
}

export const fadeOut = (targets: AnimeTarget, options: AnimationOptions = {}): AnimeInstance | null => {
  const duration = options.duration ?? defaults.duration
  if (prefersReducedMotion()) {
    settle(targets, { opacity: 0 })
    options.onComplete?.()
    return null
  }
  return anime({
    targets,
    opacity: [1, 0],
    duration,
    delay: options.delay ?? 0,
    easing: options.easing ?? defaults.easing,
    complete: options.onComplete,
  })
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

export const slideIn = (targets: AnimeTarget, direction: SlideDirection, options: AnimationOptions = {}): AnimeInstance | null => {
  const duration = options.duration ?? defaults.duration
  if (prefersReducedMotion()) {
    settle(targets, { opacity: 1, transform: 'translate(0, 0)' })
    options.onComplete?.()
    return null
  }
  return anime({
    targets,
    opacity: [0, 1],
    translateX: direction === 'left' || direction === 'right' ? [slideOffset[direction], 0] : 0,
    translateY: direction === 'up' || direction === 'down' ? [slideOffset[direction], 0] : 0,
    duration,
    delay: options.delay ?? 0,
    easing: options.easing ?? defaults.easing,
    complete: options.onComplete,
  })
}

export const slideOut = (targets: AnimeTarget, direction: SlideDirection, options: AnimationOptions = {}): AnimeInstance | null => {
  const duration = options.duration ?? defaults.duration
  if (prefersReducedMotion()) {
    settle(targets, { opacity: 0, transform: slideTransform(direction, true) })
    options.onComplete?.()
    return null
  }
  return anime({
    targets,
    opacity: [1, 0],
    translateX: direction === 'left' || direction === 'right' ? [0, slideOffset[direction]] : 0,
    translateY: direction === 'up' || direction === 'down' ? [0, slideOffset[direction]] : 0,
    duration,
    delay: options.delay ?? 0,
    easing: options.easing ?? defaults.easing,
    complete: options.onComplete,
  })
}

export const staggerFade = (targets: AnimeTarget, options: AnimationOptions & { staggerDelay?: number } = {}): AnimeInstance | null => {
  const duration = options.duration ?? defaults.duration
  const stagger = options.staggerDelay ?? 40
  if (prefersReducedMotion()) {
    settle(targets, { opacity: 1 })
    options.onComplete?.()
    return null
  }
  return anime({
    targets,
    opacity: [0, 1],
    duration,
    delay: anime.stagger(stagger, { start: options.delay ?? 0 }),
    easing: options.easing ?? defaults.easing,
    complete: options.onComplete,
  })
}

export const staggerSlide = (
  targets: AnimeTarget,
  direction: SlideDirection,
  options: AnimationOptions & { staggerDelay?: number } = {},
): AnimeInstance | null => {
  const duration = options.duration ?? defaults.duration
  const stagger = options.staggerDelay ?? 50
  if (prefersReducedMotion()) {
    settle(targets, { opacity: 1, transform: 'translate(0, 0)' })
    options.onComplete?.()
    return null
  }
  return anime({
    targets,
    opacity: [0, 1],
    translateX: direction === 'left' || direction === 'right' ? [slideOffset[direction], 0] : 0,
    translateY: direction === 'up' || direction === 'down' ? [slideOffset[direction], 0] : 0,
    duration,
    delay: anime.stagger(stagger, { start: options.delay ?? 0 }),
    easing: options.easing ?? defaults.easing,
    complete: options.onComplete,
  })
}

export const popScale = (targets: AnimeTarget, options: AnimationOptions = {}): AnimeInstance | null => {
  const duration = options.duration ?? 350
  if (prefersReducedMotion()) {
    settle(targets, { opacity: 1, transform: 'scale(1)' })
    options.onComplete?.()
    return null
  }
  return anime({
    targets,
    opacity: [0, 1],
    scale: [0.6, 1.05, 1],
    duration,
    delay: options.delay ?? 0,
    easing: 'easeOutCubic',
    complete: options.onComplete,
  })
}

export const pulse = (targets: AnimeTarget, options: AnimationOptions & { iterations?: number } = {}): AnimeInstance | null => {
  const duration = options.duration ?? 600
  const iterations = options.iterations ?? 3
  if (prefersReducedMotion()) return null
  return anime({
    targets,
    scale: [1, 1.12, 1],
    duration,
    loop: iterations,
    delay: options.delay ?? 0,
    easing: 'easeInOutSine',
    complete: options.onComplete,
  })
}

// Dibuja el contorno de un path/circle/line SVG con stroke-dashoffset.
export const drawOn = (targets: AnimeTarget, options: AnimationOptions = {}): AnimeInstance | null => {
  const duration = options.duration ?? 700
  if (prefersReducedMotion()) {
    anime.set(targets, { strokeDashoffset: 0 })
    options.onComplete?.()
    return null
  }
  return anime({
    targets,
    strokeDashoffset: [anime.setDashoffset, 0],
    duration,
    delay: options.delay ?? 0,
    easing: 'easeInOutSine',
    complete: options.onComplete,
  })
}

export const confetti = (target: AnimeTarget, colors: string[] = ['#D9B384', '#FDDDB4', '#22C55E', '#F8FAFC'], options: AnimationOptions = {}): AnimeInstance | null => {
  const duration = options.duration ?? 900
  if (prefersReducedMotion()) {
    options.onComplete?.()
    return null
  }
  return anime({
    targets: target,
    translateX: () => anime.random(-90, 90),
    translateY: () => anime.random(-120, 20),
    rotate: () => anime.random(-180, 180),
    scale: () => [1, anime.random(0.6, 1.2)],
    opacity: { value: [1, 0], easing: 'easeOutQuad' },
    backgroundColor: () => colors[Math.floor(Math.random() * colors.length)],
    duration,
    delay: anime.stagger(18, { start: options.delay ?? 0 }),
    easing: 'easeOutCubic',
    complete: options.onComplete,
  })
}

// Conveniencia: si el usuario pide reducir el movimiento, anime no anima,
// pero el estado base .anime-ready (opacity:0) lo deja invisible. Este helper
// limpia la clase para que nada quede oculto sin animación.
export const ensureVisible = (targets: AnimeTarget): void => {
  const els = Array.isArray(targets) ? targets : [targets]
  for (const t of els) {
    if (t instanceof Element) t.classList.remove('anime-ready')
  }
}
