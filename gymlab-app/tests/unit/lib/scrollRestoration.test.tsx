// @vitest-environment jsdom
// Memoria de scroll y hook de restauración (F134/T4): guarda sin re-renderizar,
// restaura solo cuando la pantalla está lista y respeta el alto real del documento.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { clearScrollMemory, readScroll, saveScroll, scrollKeyFor } from '@/lib/scrollMemory'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'

const setDocumentHeight = (height: number) => {
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: height,
  })
}

beforeEach(() => {
  clearScrollMemory()
  setDocumentHeight(5000)
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
})

afterEach(() => {
  cleanup()
  clearScrollMemory()
  vi.restoreAllMocks()
  window.scrollTo = () => {}
})

describe('scrollMemory', () => {
  it('guarda y lee por clave de pantalla', () => {
    saveScroll(scrollKeyFor('/ejercicios', '?q=press'), 640)
    expect(readScroll(scrollKeyFor('/ejercicios', '?q=press'))).toBe(640)
    expect(readScroll('/otra')).toBe(0)
  })

  it('guardar 0 no deja entrada', () => {
    saveScroll('/rutinas', 300)
    saveScroll('/rutinas', 0)
    expect(readScroll('/rutinas')).toBe(0)
  })
})

const Probe = ({ ready }: { ready: boolean }) => {
  useScrollRestoration(ready)
  return <div>pantalla</div>
}

const WithNav = ({ ready, to }: { ready: boolean; to: string }) => {
  const navigate = useNavigate()
  return (
    <>
      <Probe ready={ready} />
      <button type="button" onClick={() => navigate(to)}>
        ir
      </button>
    </>
  )
}

describe('useScrollRestoration', () => {
  it('restaura la posición guardada cuando la pantalla está lista', () => {
    saveScroll('/ejercicios', 1200)
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo

    render(
      <MemoryRouter initialEntries={['/ejercicios']}>
        <Probe ready />
      </MemoryRouter>
    )

    expect(scrollTo).toHaveBeenCalledWith(0, 1200)
  })

  it('no restaura mientras la pantalla no está lista', () => {
    saveScroll('/ejercicios', 1200)
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo

    render(
      <MemoryRouter initialEntries={['/ejercicios']}>
        <Probe ready={false} />
      </MemoryRouter>
    )

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('clampea al alto real del documento', () => {
    setDocumentHeight(1000)
    saveScroll('/ejercicios', 4000)
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo

    render(
      <MemoryRouter initialEntries={['/ejercicios']}>
        <Probe ready />
      </MemoryRouter>
    )

    // 1000 - 800 = 200 disponibles.
    expect(scrollTo).toHaveBeenCalledWith(0, 200)
  })

  it('guarda al navegar a otra pantalla', () => {
    window.scrollY = 900
    render(
      <MemoryRouter initialEntries={['/ejercicios', '/rutinas']} initialIndex={0}>
        <WithNav ready to="/rutinas" />
      </MemoryRouter>
    )

    // Simula el scroll previo y el cambio de ruta.
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('pagehide'))

    expect(readScroll('/ejercicios')).toBe(900)
  })
})
