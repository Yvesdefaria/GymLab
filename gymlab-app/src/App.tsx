// Componente raíz: providers, enrutador y hook global de scroll por arrastre.
import { AppRouter } from './app/router'
import { Providers } from './app/providers'
import { useGlobalDragScroll } from './hooks/useGlobalDragScroll'

// Compone el árbol de la aplicación.
const App = () => {
  // Scroll por arrastre activo en toda la UI móvil.
  useGlobalDragScroll()
  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}

export default App
