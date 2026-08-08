// Hook que gestiona el tema claro/oscuro y la paleta de color, sincronizando CSS, localStorage y meta.
import { useCallback, useEffect, useState } from 'react'
import { metaRepo } from '@/data/repositories'

export type Theme = 'night' | 'day'

export const PALETTES = ['gold', 'energy', 'crimson', 'electric', 'violet', 'gray'] as const
export type Palette = (typeof PALETTES)[number]

const THEME_KEY = 'gymlab.theme'
const PALETTE_KEY = 'gymlab.palette'

// Lee el tema guardado; migra los valores antiguos 'gray-night'/'gray-day' a la paleta gray.
const readTheme = (): Theme => {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'gray-night' || saved === 'gray-day') {
    localStorage.setItem(PALETTE_KEY, 'gray')
    return saved === 'gray-day' ? 'day' : 'night'
  }
  return saved === 'day' ? 'day' : 'night'
}

const readStored = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
  const saved = localStorage.getItem(key)
  return (allowed as readonly string[]).includes(saved ?? '') ? (saved as T) : fallback
}

// Sincroniza la meta tag theme-color con el color CTA actual (barra de navegación del navegador).
const applyThemeColorMeta = () => {
  const meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) return
  const cta = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-cta')
    .trim()
  if (cta) meta.setAttribute('content', cta)
}

// Expone tema y paleta actuales con sus setters; cada cambio se aplica al DOM y se persiste.
export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(readTheme)
  const [palette, setPaletteState] = useState<Palette>(() => readStored(PALETTE_KEY, PALETTES, 'gold'))

  // Aplica el tema al documento y lo guarda en localStorage y en la tabla meta.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
    void metaRepo.set('theme', theme)
    applyThemeColorMeta()
  }, [theme])

  // Aplica la paleta al documento y la guarda igualmente.
  useEffect(() => {
    document.documentElement.dataset.palette = palette
    localStorage.setItem(PALETTE_KEY, palette)
    void metaRepo.set('palette', palette)
    applyThemeColorMeta()
  }, [palette])

  const setTheme = useCallback((next: Theme) => setThemeState(next), [])
  const setPalette = useCallback((next: Palette) => setPaletteState(next), [])

  return { theme, setTheme, palette, setPalette }
}
