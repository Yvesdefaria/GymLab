// Colores categóricos de datos de Stats (grupos musculares, composición, etc.)
// leídos de las variables --color-data-* del tema activo. No son colores de marca:
// solo se usan en marcas pequeñas y el verde queda reservado a meta/PR/cumplido.
import { useEffect, useState } from 'react'

export interface DataColors {
  chest: string
  back: string
  legs: string
  shoulders: string
  arms: string
  core: string
  cardio: string
  fat: string
  rest: string
}

const readDataColors = (): DataColors => {
  const s = getComputedStyle(document.documentElement)
  const get = (name: string, fallback: string) =>
    s.getPropertyValue(name).trim() || fallback
  return {
    chest: get('--color-data-chest', '#e07a5f'),
    back: get('--color-data-back', '#5b8fb9'),
    legs: get('--color-data-legs', '#4fa8a0'),
    shoulders: get('--color-data-shoulders', '#c98a3d'),
    arms: get('--color-data-arms', '#a78bfa'),
    core: get('--color-data-core', '#d98cb3'),
    cardio: get('--color-data-cardio', '#5ba8d6'),
    fat: get('--color-data-fat', '#e0a458'),
    rest: get('--color-data-rest', '#8a8f98'),
  }
}

export const useDataColors = (): DataColors => {
  const [colors, setColors] = useState<DataColors>(() => readDataColors())

  useEffect(() => {
    const update = () => setColors(readDataColors())
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
