// Rutas de la app con carga diferida (lazy) para partir el bundle por página.
import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'

// Cada página se carga de forma diferida: solo se descarga su JS al navegar a la ruta.
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
const WearableSyncView = lazy(() => import('../pages/WearableSyncView').then((m) => ({ default: m.WearableSyncView })))
const RutinaBuilderPage = lazy(() => import('../pages/RutinaBuilderPage').then((m) => ({ default: m.RutinaBuilderPage })))
const PesoCorporalPage = lazy(() => import('../pages/PesoCorporalPage').then((m) => ({ default: m.PesoCorporalPage })))
const MedidasCorporalesPage = lazy(() => import('../pages/MedidasCorporalesPage').then((m) => ({ default: m.MedidasCorporalesPage })))
const GrasaCorporalPage = lazy(() => import('../pages/GrasaCorporalPage').then((m) => ({ default: m.GrasaCorporalPage })))
const NavyPage = lazy(() => import('../pages/NavyPage').then((m) => ({ default: m.NavyPage })))
const TimerPage = lazy(() => import('../pages/TimerPage').then((m) => ({ default: m.TimerPage })))
const NutritionRoute = lazy(() => import('../pages/NutritionRoute').then((m) => ({ default: m.NutritionRoute })))
const SupplementsRoute = lazy(() => import('../pages/SupplementsRoute').then((m) => ({ default: m.SupplementsRoute })))
const ProgressPhotosRoute = lazy(() => import('../pages/ProgressPhotosRoute').then((m) => ({ default: m.ProgressPhotosRoute })))
const AchievementsRoute = lazy(() => import('../pages/AchievementsRoute').then((m) => ({ default: m.AchievementsRoute })))
const TerminosPage = lazy(() => import('../pages/TerminosPage').then((m) => ({ default: m.TerminosPage })))
const ObjetivosPage = lazy(() => import('../pages/ObjetivosPage').then((m) => ({ default: m.ObjetivosPage })))

// Tabla de rutas principal; el AppShell es el layout común de todas las páginas.
const LoadingFallback = () => (
  <div className="flex min-h-dvh items-center justify-center bg-bg">
    <div className="text-center">
      <div className="mb-3 inline-block size-8 animate-spin rounded-full border-2 border-border border-t-cta" />
    </div>
  </div>
)

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
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
            <Route path="wearables" element={<WearableSyncView />} />
            <Route path="perfil" element={<PerfilPage />} />
            <Route path="peso-corporal" element={<PesoCorporalPage />} />
            <Route path="calendario" element={<CalendarioPage />} />
            <Route path="cuerpo" element={<CuerpoPage />} />
            <Route path="guias" element={<GuiasPage />} />
            <Route path="guias/:slug" element={<GuiaDetailPage />} />
            <Route path="calculadoras" element={<CalculadorasPage />} />
            <Route path="calculadoras/imc" element={<ImcPage />} />
            <Route path="calculadoras/calorias" element={<CaloriasPage />} />
            <Route path="calculadoras/macros" element={<Navigate to="/calculadoras/calorias" replace />} />
            <Route path="calculadoras/1rm" element={<OneRepMaxPage />} />
            <Route path="calculadoras/agua" element={<AguaPage />} />
            <Route path="calculadoras/conversor" element={<ConversorPage />} />
            <Route path="calculadoras/medidas" element={<MedidasCorporalesPage />} />
            <Route path="calculadoras/grasa" element={<GrasaCorporalPage />} />
            <Route path="calculadoras/navy" element={<NavyPage />} />
            <Route path="ejercicios" element={<EjerciciosPage />} />
            <Route path="ejercicios/:slug" element={<EjercicioDetailPage />} />
            <Route path="timer" element={<TimerPage />} />
            <Route path="nutricion" element={<NutritionRoute />} />
            <Route path="suplementos" element={<SupplementsRoute />} />
            <Route path="progreso-fotos" element={<ProgressPhotosRoute />} />
            <Route path="logros" element={<AchievementsRoute />} />
            <Route path="terminos" element={<TerminosPage />} />
            <Route path="objetivos" element={<ObjetivosPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
