import { useEffect, useState } from 'react'

export interface ThemeColors {
  bg: string
  bgElevated: string
  fg: string
  accent: string
  gold: string
  cta: string
  muted: string
  border: string
}

const readColors = (): ThemeColors => {
  const s = getComputedStyle(document.documentElement)
  const get = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback
  return {
    bg: get('--color-bg', '#121214'),
    bgElevated: get('--color-bg-elevated', '#242422'),
    fg: get('--color-fg', '#f8fafc'),
    accent: get('--color-accent', '#d9b384'),
    gold: get('--color-gold', '#d9b384'),
    cta: get('--color-cta', '#d9b384'),
    muted: get('--color-muted', '#a39b8c'),
    border: get('--color-border', '#3a352b'),
  }
}

export const useThemeColors = (): ThemeColors => {
  const [colors, setColors] = useState<ThemeColors>(() => readColors())

  useEffect(() => {
    const update = () => setColors(readColors())
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-palette', 'class', 'style'],
    })
    return () => observer.disconnect()
  }, [])

  return colors
}
