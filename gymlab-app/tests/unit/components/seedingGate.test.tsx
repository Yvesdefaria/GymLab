// F103/T3: el gate del contenido reutiliza el Loader compartido mientras el
// seed corre y, si falla, muestra un estado recuperable con reintento.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import '@/i18n'
import { SeedingGate } from '@/components/layout/SeedingGate'

describe('SeedingGate', () => {
  it('mientras siembra reutiliza el Loader compartido', () => {
    const html = renderToStaticMarkup(
      <SeedingGate status="seeding" error={null} onRetry={() => {}} />,
    )
    expect(html).toContain('role="status"')
    expect(html).toContain('Cargando GymLab')
  })

  it('en error muestra el mensaje y el botón de reintento', () => {
    const html = renderToStaticMarkup(
      <SeedingGate status="error" error="catálogo caído" onRetry={() => {}} />,
    )
    expect(html).toContain('catálogo caído')
    expect(html).toContain('Reintentar')
  })
})
