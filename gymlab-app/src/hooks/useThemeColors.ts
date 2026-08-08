// Hook que expone los colores del tema actual como valores reactivos (para gráficos y estilos dinámicos).
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
  success: string
  danger: string
}

// Lee las variables CSS del tema raíz con fallbacks por si alguna no está definida.
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
    success: get('--color-success', '#22c55e'),
    danger: get('--color-danger', '#ef4444'),
  }
}

// Devuelve los colores actuales y los mantiene al día observando cambios en el dataset del tema.
export const useThemeColors = (): ThemeColors => {
  const [colors, setColors] = useState<ThemeColors>(() => readColors())

  useEffect(() => {
    // Relee los colores cada vez que cambian data-theme, data-palette o el estilo del raíz.
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
