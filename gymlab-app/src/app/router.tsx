import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'

const EntrenarPage = lazy(() => import('../pages/EntrenarPage').then((m) => ({ default: m.EntrenarPage })))
const RutinasPage = lazy(() => import('../pages/RutinasPage').then((m) => ({ default: m.RutinasPage })))
const EstadisticasPage = lazy(() => import('../pages/EstadisticasPage').then((m) => ({ default: m.EstadisticasPage })))
const RutinaDetailPage = lazy(() => import('../pages/RutinaDetailPage').then((m) => ({ default: m.RutinaDetailPage })))
const PapersPage = lazy(() => import('../pages/PapersPage').then((m) => ({ default: m.PapersPage })))
const PaperDetailPage = lazy(() => import('../pages/PaperDetailPage').then((m) => ({ default: m.PaperDetailPage })))
const MasPage = lazy(() => import('../pages/MasPage').then((m) => ({ default: m.MasPage })))
const PerfilPage = lazy(() => import('../pages/PerfilPage').then((m) => ({ default: m.PerfilPage })))
const CalculadorasPage = lazy(() => import('../pages/CalculadorasPage').then((m) => ({ default: m.CalculadorasPage })))
const ImcPage = lazy(() => import('../pages/ImcPage').then((m) => ({ default: m.ImcPage })))
const CaloriasPage = lazy(() => import('../pages/CaloriasPage').then((m) => ({ default: m.CaloriasPage })))
const MacrosPage = lazy(() => import('../pages/MacrosPage').then((m) => ({ default: m.MacrosPage })))
const OneRepMaxPage = lazy(() => import('../pages/OneRepMaxPage').then((m) => ({ default: m.OneRepMaxPage })))
const AguaPage = lazy(() => import('../pages/AguaPage').then((m) => ({ default: m.AguaPage })))
const ConversorPage = lazy(() => import('../pages/ConversorPage').then((m) => ({ default: m.ConversorPage })))
const EntrenamientoPage = lazy(() => import('../pages/EntrenamientoPage').then((m) => ({ default: m.EntrenamientoPage })))
const SesionPage = lazy(() => import('../pages/SesionPage').then((m) => ({ default: m.SesionPage })))
const EjerciciosPage = lazy(() => import('../pages/EjerciciosPage').then((m) => ({ default: m.EjerciciosPage })))
const EjercicioDetailPage = lazy(() => import('../pages/EjercicioDetailPage').then((m) => ({ default: m.EjercicioDetailPage })))
const CalendarioPage = lazy(() => import('../pages/CalendarioPage').then((m) => ({ default: m.CalendarioPage })))
const CuerpoPage = lazy(() => import('../pages/CuerpoPage').then((m) => ({ default: m.CuerpoPage })))
const GuiasPage = lazy(() => import('../pages/GuiasPage').then((m) => ({ default: m.GuiasPage })))
const GuiaDetailPage = lazy(() => import('../pages/GuiaDetailPage').then((m) => ({ default: m.GuiaDetailPage })))
const AjustesPage = lazy(() => import('../pages/AjustesPage').then((m) => ({ default: m.AjustesPage })))
const RutinaBuilderPage = lazy(() => import('../pages/RutinaBuilderPage').then((m) => ({ default: m.RutinaBuilderPage })))
const PesoCorporalPage = lazy(() => import('../pages/PesoCorporalPage').then((m) => ({ default: m.PesoCorporalPage })))
const MedidasCorporalesPage = lazy(() => import('../pages/MedidasCorporalesPage').then((m) => ({ default: m.MedidasCorporalesPage })))
const GrasaCorporalPage = lazy(() => import('../pages/GrasaCorporalPage').then((m) => ({ default: m.GrasaCorporalPage })))

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<EntrenarPage />} />
          <Route path="entrenamiento/:id" element={<SesionPage />} />
          <Route path="entrenamiento/active" element={<EntrenamientoPage />} />
          <Route path="rutinas" element={<RutinasPage />} />
          <Route path="estadisticas" element={<EstadisticasPage />} />
          <Route path="rutinas/nueva" element={<RutinaBuilderPage />} />
          <Route path="rutinas/:slug/editar" element={<RutinaBuilderPage />} />
          <Route path="rutinas/:slug" element={<RutinaDetailPage />} />
          <Route path="papers" element={<PapersPage />} />
          <Route path="papers/:slug" element={<PaperDetailPage />} />
          <Route path="mas" element={<MasPage />} />
          <Route path="ajustes" element={<AjustesPage />} />
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="peso-corporal" element={<PesoCorporalPage />} />
          <Route path="calendario" element={<CalendarioPage />} />
          <Route path="cuerpo" element={<CuerpoPage />} />
          <Route path="guias" element={<GuiasPage />} />
          <Route path="guias/:slug" element={<GuiaDetailPage />} />
          <Route path="calculadoras" element={<CalculadorasPage />} />
          <Route path="calculadoras/imc" element={<ImcPage />} />
          <Route path="calculadoras/calorias" element={<CaloriasPage />} />
          <Route path="calculadoras/macros" element={<MacrosPage />} />
          <Route path="calculadoras/1rm" element={<OneRepMaxPage />} />
          <Route path="calculadoras/agua" element={<AguaPage />} />
          <Route path="calculadoras/conversor" element={<ConversorPage />} />
          <Route path="calculadoras/medidas" element={<MedidasCorporalesPage />} />
          <Route path="calculadoras/grasa" element={<GrasaCorporalPage />} />
          <Route path="ejercicios" element={<EjerciciosPage />} />
          <Route path="ejercicios/:slug" element={<EjercicioDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
