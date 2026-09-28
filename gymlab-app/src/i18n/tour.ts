// F101: catálogo del tour guiado y de los tips de primera vez.
// Igual que help.ts: si una clave no existe en el esquema `es`, no compila.
import type { I18nKey } from '@/i18n'
import type { SectionId } from '@/domain/tour'

export type TourStepId =
  | 'bienvenida'
  | 'dia'
  | 'empezar'
  | 'tabbar'
  | 'rutinas'
  | 'estadisticas'
  | 'logros'
  | 'cierre'

export interface TourStep {
  id: TourStepId
  route: string
  // Ancla `data-tour` a resaltar; sin ancla el paso cae a globo centrado.
  anchor?: string
  bodyKey: I18nKey
}

export const TOUR_STEPS: TourStep[] = [
  { id: 'bienvenida', route: '/', bodyKey: 'tour.steps.bienvenida' },
  { id: 'dia', route: '/', anchor: 'home-hero', bodyKey: 'tour.steps.dia' },
  { id: 'empezar', route: '/', anchor: 'home-start', bodyKey: 'tour.steps.empezar' },
  { id: 'tabbar', route: '/', anchor: 'tabbar', bodyKey: 'tour.steps.tabbar' },
  { id: 'rutinas', route: '/rutinas', anchor: 'rutinas-main', bodyKey: 'tour.steps.rutinas' },
  { id: 'estadisticas', route: '/estadisticas', anchor: 'stats-tabs', bodyKey: 'tour.steps.estadisticas' },
  { id: 'logros', route: '/logros', anchor: 'logros-progress', bodyKey: 'tour.steps.logros' },
  { id: 'cierre', route: '/mas', anchor: 'mas-list', bodyKey: 'tour.steps.cierre' },
]

// Tips breves por sección: qué podés conseguir ahí (una sola vez).
export const SECTION_TIPS: Record<SectionId, { bodyKey: I18nKey }> = {
  inicio: { bodyKey: 'tour.tips.inicio' },
  rutinas: { bodyKey: 'tour.tips.rutinas' },
  estadisticas: { bodyKey: 'tour.tips.estadisticas' },
  logros: { bodyKey: 'tour.tips.logros' },
  mas: { bodyKey: 'tour.tips.mas' },
  perfil: { bodyKey: 'tour.tips.perfil' },
}
