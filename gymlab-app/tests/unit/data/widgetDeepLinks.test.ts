import { describe, expect, it } from 'vitest'
import { WIDGET_PASSOS_URL, extractWidgetRoute } from '@/data/widgetDeepLinks'

describe('extractWidgetRoute', () => {
  it('reconoce el deep link del widget (host «pasos» y forma con path)', () => {
    expect(extractWidgetRoute(WIDGET_PASSOS_URL)).toBe('/pasos')
    expect(extractWidgetRoute('com.gymlab.app:///pasos')).toBe('/pasos')
  })

  // lote 29 (R3-4): la forma host-vacío con UNA barra final se normaliza — simetría
  // con la forma con host, que ya la ignoraba.
  it('normaliza una barra final en la forma host-vacío', () => {
    expect(extractWidgetRoute('com.gymlab.app:///pasos/')).toBe('/pasos')
    expect(extractWidgetRoute('com.gymlab.app://pasos/')).toBe('/pasos')
  })

  // 84d.followups (a): el matcher viejo aceptaba cualquier URL que CONTENGA
  // «pasos» (scheme ajeno incluido); ahora solo el scheme propio pasa.
  it('rechaza URLs ajenas al scheme propio, aunque contengan «pasos»', () => {
    expect(extractWidgetRoute('https://pasos.example.com/')).toBeNull()
    expect(extractWidgetRoute('https://example.com/pasos')).toBeNull()
    expect(extractWidgetRoute('notaurl://pasos')).toBeNull()
  })

  it('rechaza hosts que solo se parecen a «pasos»', () => {
    expect(extractWidgetRoute('com.gymlab.app://pasos-extra')).toBeNull()
    expect(extractWidgetRoute('com.gymlab.app://xpasosy')).toBeNull()
    expect(extractWidgetRoute('com.gymlab.app://x/pasos')).toBeNull()
    expect(extractWidgetRoute('com.gymlab.app://steps')).toBeNull()
  })

  it('ignora URLs vacías o inválidas', () => {
    expect(extractWidgetRoute('https://localhost/')).toBeNull()
    expect(extractWidgetRoute('')).toBeNull()
    expect(extractWidgetRoute(null)).toBeNull()
    expect(extractWidgetRoute(undefined)).toBeNull()
    expect(extractWidgetRoute('not a url')).toBeNull()
  })
})
