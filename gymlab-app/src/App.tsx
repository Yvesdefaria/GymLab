import { AppRouter } from './app/router'
import { Providers } from './app/providers'

const App = () => {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}

export default App
