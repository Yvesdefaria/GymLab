// Fallos recuperables por tab lazy (F103/T8-R3): un chunk que no resuelve en la
// primera visita offline no debe tumbar el boundary ancestro: el tab muestra su
// propio estado de error con reintento y el resto de /estadisticas sigue vivo.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import '@/i18n'
import { TabErrorBoundary, TabFailure } from '@/components/stats/TabErrorBoundary'

describe('TabErrorBoundary', () => {
  it('convierte un throw de render en el estado fallido local', () => {
    expect(TabErrorBoundary.getDerivedStateFromError()).toEqual({ failed: true })
  })

  it('el estado de error ofrece el reintento con copy propio', () => {
    const html = renderToStaticMarkup(<TabFailure onRetry={() => {}} />)
    expect(html).toContain('No se pudo cargar esta sección')
    expect(html).toContain('Reintentar')
  })
})
