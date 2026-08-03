import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { EntrenarPage } from '../pages/EntrenarPage'
import { RutinasPage } from '../pages/RutinasPage'
import { RutinaDetailPage } from '../pages/RutinaDetailPage'
import { PapersPage } from '../pages/PapersPage'
import { PaperDetailPage } from '../pages/PaperDetailPage'
import { MasPage } from '../pages/MasPage'
import { PerfilPage } from '../pages/PerfilPage'
import { CalculadorasPage } from '../pages/CalculadorasPage'
import { ImcPage } from '../pages/ImcPage'
import { CaloriasPage } from '../pages/CaloriasPage'
import { EntrenamientoPage } from '../pages/EntrenamientoPage'
import { EjerciciosPage } from '../pages/EjerciciosPage'
import { EjercicioDetailPage } from '../pages/EjercicioDetailPage'

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<EntrenarPage />} />
          <Route path="entrenamiento/:id" element={<EntrenamientoPage />} />
          <Route path="entrenamiento/active" element={<EntrenamientoPage />} />
          <Route path="rutinas" element={<RutinasPage />} />
          <Route path="rutinas/:slug" element={<RutinaDetailPage />} />
          <Route path="papers" element={<PapersPage />} />
          <Route path="papers/:slug" element={<PaperDetailPage />} />
          <Route path="mas" element={<MasPage />} />
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="calculadoras" element={<CalculadorasPage />} />
          <Route path="calculadoras/imc" element={<ImcPage />} />
          <Route path="calculadoras/calorias" element={<CaloriasPage />} />
          <Route path="ejercicios" element={<EjerciciosPage />} />
          <Route path="ejercicios/:slug" element={<EjercicioDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
