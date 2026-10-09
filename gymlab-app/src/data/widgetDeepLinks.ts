// Parseo del deep link del widget (F84d): com.gymlab.app://pasos → /pasos.
// Contraparte nativa: WidgetRender.PASSOS_URL (android/.../WidgetRender.java).
export const WIDGET_PASSOS_URL = 'com.gymlab.app://pasos'

export const extractWidgetRoute = (url: string | null | undefined): '/pasos' | null => {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const marker = `${parsed.host}${parsed.pathname}`.toLowerCase()
    return marker.includes('pasos') ? '/pasos' : null
  } catch {
    return null
  }
}
