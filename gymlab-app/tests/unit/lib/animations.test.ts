// @vitest-environment jsdom
// F121/T4 follow-ups: contrato de `drawOn` (normaliza selector CSS, NodeList,
// HTMLCollection o array antes de preparar el trazo — la regresión R3-1 del
// review) y del callback `onComplete` (síncrono con reduced-motion, viajando a
// `animate` en el caso normal). `animejs` va mockeado: se observan las llamadas.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { animateSpy } = vi.hoisted(() => ({ animateSpy: vi.fn() }))

// Sentinela de retorno del mock: los helpers deben devolver lo que devuelve
// `animate` (passthrough), no un valor propio.
const ANIMATE_SENTINEL = { animated: true }

vi.mock('animejs', () => ({
  animate: animateSpy,
  stagger: vi.fn(() => ({})),
  utils: { random: (min: number, max: number) => (min + max) / 2 },
}))

import { drawOn, fadeIn, pulse } from '@/lib/animations'

const setReducedMotion = (matches: boolean): void => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }) as unknown as typeof window.matchMedia
}

const makeSvg = () => {
  document.body.innerHTML = '<svg id="probe"><path id="p1"></path><path id="p2"></path></svg>'
  const svg = document.getElementById('probe') as unknown as SVGSVGElement
  const p1 = document.getElementById('p1') as unknown as SVGGeometryElement
  const p2 = document.getElementById('p2') as unknown as SVGGeometryElement
  // jsdom no implementa getTotalLength: se stubbea por elemento (y así queda
  // observable que drawOn lo consulta para preparar el trazo).
  const len1 = vi.fn(() => 100)
  const len2 = vi.fn(() => 50)
  p1.getTotalLength = len1
  p2.getTotalLength = len2
  return { svg, p1, p2, len1, len2 }
}

beforeEach(() => {
  document.body.innerHTML = ''
  animateSpy.mockClear()
  animateSpy.mockReturnValue(ANIMATE_SENTINEL)
  setReducedMotion(false)
})

describe('drawOn — normalización de targets (f121.t4-b)', () => {
  it('selector CSS: resuelve los elementos, prepara el trazo y anima esa lista', () => {
    const { p1, p2, len1, len2 } = makeSvg()
    drawOn('path')
    expect(len1).toHaveBeenCalledTimes(1)
    expect(len2).toHaveBeenCalledTimes(1)
    expect(p1.style.strokeDasharray).toBe('100')
    expect(p1.style.strokeDashoffset).toBe('100')
    expect(p2.style.strokeDasharray).toBe('50')
    expect(animateSpy).toHaveBeenCalledTimes(1)
    expect(animateSpy.mock.calls[0][0]).toEqual([p1, p2])
  })

  it('NodeList: prepara el trazo de cada elemento', () => {
    const { p1, p2 } = makeSvg()
    drawOn(document.querySelectorAll('path'))
    expect(p1.style.strokeDashoffset).toBe('100')
    expect(p2.style.strokeDashoffset).toBe('50')
    expect(animateSpy.mock.calls[0][0]).toEqual([p1, p2])
  })

  it('HTMLCollection: prepara el trazo de cada elemento', () => {
    const { svg, p1, p2 } = makeSvg()
    drawOn(svg.children)
    expect(p1.style.strokeDashoffset).toBe('100')
    expect(p2.style.strokeDashoffset).toBe('50')
    expect(animateSpy.mock.calls[0][0]).toEqual([p1, p2])
  })

  it('array de elementos: prepara el trazo', () => {
    const { p1 } = makeSvg()
    drawOn([p1])
    expect(p1.style.strokeDashoffset).toBe('100')
    expect(animateSpy.mock.calls[0][0]).toEqual([p1])
  })

  it('reduced-motion: asienta el estado final sin animar y llama onComplete', () => {
    setReducedMotion(true)
    const { p1 } = makeSvg()
    const onComplete = vi.fn()
    const result = drawOn([p1], { onComplete })
    expect(result).toBeNull()
    expect(p1.style.strokeDashoffset).toBe('0')
    expect(animateSpy).not.toHaveBeenCalled()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

describe('onComplete — contrato con v4 (f121.t4-b)', () => {
  it('sin reduced-motion: el callback viaja a animate', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const onComplete = vi.fn()
    fadeIn(el, { onComplete })
    expect(animateSpy).toHaveBeenCalledTimes(1)
    expect(animateSpy.mock.calls[0][1].onComplete).toBe(onComplete)
  })

  it('reduced-motion: el callback se invoca de forma síncrona', () => {
    setReducedMotion(true)
    const el = document.createElement('div')
    document.body.appendChild(el)
    const onComplete = vi.fn()
    const result = fadeIn(el, { onComplete })
    expect(result).toBeNull()
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(el.style.opacity).toBe('1')
  })
})

describe('pulse — contrato de loop con v4 (f121.t4-d)', () => {
  it('default: 3 iteraciones visibles → loop 2 (v4 cuenta repeticiones)', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const result = pulse(el)
    expect(animateSpy).toHaveBeenCalledTimes(1)
    expect(animateSpy.mock.calls[0][0]).toBe(el)
    expect(animateSpy.mock.calls[0][1].loop).toBe(2)
    expect(result).toBe(ANIMATE_SENTINEL)
  })

  it('iterations: 1 → loop 0 (una sola pasada)', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    pulse(el, { iterations: 1 })
    expect(animateSpy.mock.calls[0][1].loop).toBe(0)
  })

  it('borde: iterations 0 no produce un loop negativo', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    pulse(el, { iterations: 0 })
    expect(animateSpy.mock.calls[0][1].loop).toBe(0)
  })

  it('borde: iterations negativas tampoco producen un loop negativo', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    pulse(el, { iterations: -2 })
    expect(animateSpy.mock.calls[0][1].loop).toBe(0)
  })

  it('reduced-motion: no anima y devuelve null', () => {
    setReducedMotion(true)
    const el = document.createElement('div')
    document.body.appendChild(el)
    const result = pulse(el, { iterations: 3 })
    expect(result).toBeNull()
    expect(animateSpy).not.toHaveBeenCalled()
  })
})
