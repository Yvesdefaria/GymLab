// Punto de entrada: monta la app React en el DOM con StrictMode.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppErrorBoundary } from './components/layout/AppErrorBoundary'
import { logger } from './lib/logger'
import { initSuppressLinkLongPress } from './lib/suppressLinkLongPress'

// El service worker (PWA) puede quedar sirviendo un index.html VIEJO que apunta a chunks
// lazy ya rehasheados en el build nuevo: el `import()` dinámico da 404 y, sin manejarlo,
// React desmontaba el árbol entero y la app quedaba en PANTALLA NEGRA.
// Vite emite `vite:preloadError` exactamente en ese caso: recargar trae el HTML y los
// chunks consistentes entre sí y la app se recupera sola.
// Se permite UNA recarga por sesión: si vuelve a fallar, dejamos propagar el throw para
// que lo capture el ErrorBoundary (mensaje recuperable) en vez de recargar en loop.
const PRELOAD_RELOAD_KEY = 'gymLab-preloadReload'
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem(PRELOAD_RELOAD_KEY)) return
  sessionStorage.setItem(PRELOAD_RELOAD_KEY, '1')
  window.location.reload()
})

// Marcador de sesión en consola (visible solo en dev o con el switch `gymlab.debug`).
logger.info('boot', 'arrancando GymLab', { mode: import.meta.env.MODE })

// En móvil, mantener pulsado un link abre el menú nativo con la URL interna: se suprime ahí.
initSuppressLinkLongPress()

// StrictMode detecta efectos problemáticos con el doble render en desarrollo.
// El ErrorBoundary envuelve TODO el árbol: una excepción de render no debe dejar la app
// en pantalla negra sin salida.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
