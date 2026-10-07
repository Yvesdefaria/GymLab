// F120/PH-3: paginación incremental compartida («Ver más»). El historial de peso ya
// la usaba inline; fotos de progreso la necesita para no montar cientos de <img>.
// Sin jsdom, se renderiza una sonda con renderToStaticMarkup y se audita el estado
// inicial (la expansión del botón se cubre en el e2e de la página).
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { usePagedList } from '@/hooks/usePagedList'

const Probe = ({ items, pageSize }: { items: number[]; pageSize: number }) => {
  const { visible, hasMore } = usePagedList(items, pageSize)
  return <span>{`${visible.join(',')}|${hasMore}`}</span>
}

describe('usePagedList', () => {
  it('muestra solo la primera página y avisa que hay más', () => {
    const html = renderToStaticMarkup(<Probe items={[1, 2, 3, 4, 5]} pageSize={3} />)
    expect(html).toContain('1,2,3|true')
  })

  it('sin excedente no hay más páginas', () => {
    const html = renderToStaticMarkup(<Probe items={[1, 2]} pageSize={3} />)
    expect(html).toContain('1,2|false')
  })

  it('con lista vacía queda vacía y sin más', () => {
    const html = renderToStaticMarkup(<Probe items={[]} pageSize={3} />)
    expect(html).toContain('|false')
  })
})
