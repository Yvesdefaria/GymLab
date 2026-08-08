// Punto de entrada: monta la app React en el DOM con StrictMode.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode detecta efectos problemáticos con el doble render en desarrollo.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
