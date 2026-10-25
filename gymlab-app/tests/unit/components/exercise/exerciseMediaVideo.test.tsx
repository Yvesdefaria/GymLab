// @vitest-environment jsdom
// F132.7: la media de la ficha de ejercicio queda preparada para el video corto futuro.
// Hoy no hay datos de video; cuando exista `videoUrl`, debe reproducirse en loop, sin audio
// y con la imagen como poster, sin romper el fallback de imágenes.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import '@/i18n'
import { ExerciseMedia } from '@/components/exercise/ExerciseMedia'

afterEach(cleanup)

describe('ExerciseMedia — video corto', () => {
  it('renderiza un video muted, loop e inline cuando recibe videoUrl', () => {
    const { container } = render(
      <ExerciseMedia
        name="Sentadilla"
        imageUrls={['/images/sentadilla.jpg']}
        videoUrl="/videos/sentadilla.mp4"
      />,
    )

    const video = container.querySelector('video') as HTMLVideoElement
    expect(video).not.toBeNull()
    expect(video.getAttribute('src')).toBe('/videos/sentadilla.mp4')
    expect(video.getAttribute('poster')).toBe('/images/sentadilla.jpg')
    expect(video.muted).toBe(true)
    expect(video.loop).toBe(true)
    expect(video.playsInline).toBe(true)
    expect(video.getAttribute('preload')).toBe('metadata')
    expect(video.getAttribute('aria-label')).toContain('Sentadilla')
  })

  it('sin videoUrl sigue mostrando la imagen de referencia', () => {
    const { container } = render(
      <ExerciseMedia name="Sentadilla" imageUrls={['/images/sentadilla.jpg']} />,
    )

    expect(container.querySelector('video')).toBeNull()
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toBe('/images/sentadilla.jpg')
  })
})
