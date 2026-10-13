// Parseo del deep link del widget (F84d): com.gymlab.app://pasos → /pasos.
// Contraparte nativa: WidgetRender.PASSOS_URL (android/.../WidgetRender.java).
export const WIDGET_PASSOS_URL = 'com.gymlab.app://pasos'

// Endurecido (84d.followups a): antes cualquier URL que CONTUVIERA «pasos» en
// host+path matcheaba (schemes ajenos incluidos). Ahora solo el scheme propio,
// con host exacto `pasos` o la forma canónica `com.gymlab.app:///pasos`.
const WIDGET_SCHEME = 'com.gymlab.app:'

export const extractWidgetRoute = (url: string | null | undefined): '/pasos' | null => {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== WIDGET_SCHEME) return null
    const host = parsed.host.toLowerCase()
    const path = parsed.pathname.toLowerCase()
    return host === 'pasos' || (host === '' && path === '/pasos') ? '/pasos' : null
  } catch {
    return null
  }
}
