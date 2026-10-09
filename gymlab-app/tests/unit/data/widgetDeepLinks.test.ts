import { describe, expect, it } from 'vitest'
import { extractWidgetRoute } from '@/data/widgetDeepLinks'

describe('extractWidgetRoute', () => {
  it('reconoce el deep link del widget', () => {
    expect(extractWidgetRoute('com.gymlab.app://pasos')).toBe('/pasos')
    expect(extractWidgetRoute('com.gymlab.app:///pasos')).toBe('/pasos')
  })

  it('ignora URLs ajenas, vacías o inválidas', () => {
    expect(extractWidgetRoute('https://localhost/')).toBeNull()
    expect(extractWidgetRoute('')).toBeNull()
    expect(extractWidgetRoute(null)).toBeNull()
    expect(extractWidgetRoute(undefined)).toBeNull()
    expect(extractWidgetRoute('not a url')).toBeNull()
  })
})
