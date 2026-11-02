// @vitest-environment jsdom
// Scroll de un contenedor interno (F134/T4): guarda mientras se scrollea y no borra
// la posición del contenedor anterior al cambiar de clave (regresión R3-1).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { clearScrollMemory, readScroll, saveScroll } from '@/lib/scrollMemory'
import { useElementScrollMemory } from '@/hooks/useElementScrollMemory'

const ScrollBox = ({ scrollKey }: { scrollKey: string }) => {
  const ref = useElementScrollMemory(scrollKey)
  return <div ref={ref} data-testid="box" />
}

const fakeScrollTop = (el: HTMLElement, value: number) => {
  Object.defineProperty(el, 'scrollTop', {
    configurable: true,
    get: () => value,
    set: () => undefined,
  })
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

beforeEach(() => {
  clearScrollMemory()
})

afterEach(cleanup)

describe('useElementScrollMemory', () => {
  it('guarda la posición al scrollear', async () => {
    const { getByTestId } = render(<ScrollBox scrollKey="dia-1" />)
    const box = getByTestId('box')
    fakeScrollTop(box, 320)

    box.dispatchEvent(new Event('scroll'))
    await nextFrame()

    expect(readScroll('dia-1')).toBe(320)
  })

  it('restaura la posición guardada al montar', () => {
    saveScroll('dia-2', 210)
    const setter = vi.spyOn(Element.prototype, 'scrollTop', 'set')

    render(<ScrollBox scrollKey="dia-2" />)

    expect(setter).toHaveBeenCalledWith(210)
    setter.mockRestore()
  })

  it('cambiar de clave no borra la posición del contenedor anterior', async () => {
    const { getByTestId, rerender } = render(<ScrollBox scrollKey="dia-largo" />)
    const box = getByTestId('box')
    fakeScrollTop(box, 480)

    box.dispatchEvent(new Event('scroll'))
    await nextFrame()
    expect(readScroll('dia-largo')).toBe(480)

    // Cambia el día: el cleanup no debe leer ni guardar el scrollTop ya recortado.
    fakeScrollTop(box, 0)
    rerender(<ScrollBox scrollKey="dia-corto" />)
    await nextFrame()

    expect(readScroll('dia-largo')).toBe(480)
  })
})
