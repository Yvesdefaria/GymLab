import { AppRouter } from './app/router'
import { Providers } from './app/providers'
import { useGlobalDragScroll } from './hooks/useGlobalDragScroll'

const App = () => {
  useGlobalDragScroll()
  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}

export default App
