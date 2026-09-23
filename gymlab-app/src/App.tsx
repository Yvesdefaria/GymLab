// Componente raíz: providers, enrutador y hooks globales de UI.
import { AppRouter } from './app/router'
import { Providers } from './app/providers'
import { useGlobalDragScroll } from './hooks/useGlobalDragScroll'
import { usePhotoRestore } from './hooks/usePhotoRestore'

// Compone el árbol de la aplicación.
const App = () => {
  // Scroll por arrastre activo en toda la UI móvil.
  useGlobalDragScroll()
  // Recupera fotos si Android mató la app con la cámara abierta.
  usePhotoRestore()
  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}

export default App
