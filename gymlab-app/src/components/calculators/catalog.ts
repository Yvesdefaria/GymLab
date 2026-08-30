// Catálogo del hub de calculadoras: entradas tipadas (claves i18n fuertes por `as const`)
// y recientes persistidos en localStorage (máx. 3) para las últimas abiertas.
import {
  Activity,
  ArrowRightLeft,
  Droplets,
  Flame,
  Percent,
  Ruler,
  Target,
  Trophy,
  UtensilsCrossed,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Cada entrada enlaza a su ruta bajo /calculadoras; las etiquetas se resuelven con t()
// dentro de la página (claves de i18n fuertes de EsSchema gracias al `as const`).
export const ready = [
  { to: '/calculadoras/imc', labelKey: 'calculadoras.hub.imc', descriptionKey: 'calculadoras.hub.imcDesc', icon: Activity },
  { to: '/calculadoras/calorias', labelKey: 'calculadoras.hub.calorias', descriptionKey: 'calculadoras.hub.caloriasDesc', icon: Flame },
  { to: '/calculadoras/macros', labelKey: 'calculadoras.hub.macros', descriptionKey: 'calculadoras.hub.macrosDesc', icon: UtensilsCrossed },
  { to: '/calculadoras/1rm', labelKey: 'calculadoras.hub.unoRm', descriptionKey: 'calculadoras.hub.unoRmDesc', icon: Trophy },
  { to: '/calculadoras/agua', labelKey: 'calculadoras.hub.agua', descriptionKey: 'calculadoras.hub.aguaDesc', icon: Droplets },
  { to: '/calculadoras/conversor', labelKey: 'calculadoras.hub.conversor', descriptionKey: 'calculadoras.hub.conversorDesc', icon: ArrowRightLeft },
  { to: '/calculadoras/medidas', labelKey: 'calculadoras.hub.medidas', descriptionKey: 'calculadoras.hub.medidasDesc', icon: Ruler },
  { to: '/calculadoras/grasa', labelKey: 'calculadoras.hub.grasa', descriptionKey: 'calculadoras.hub.grasaDesc', icon: Percent },
  { to: '/calculadoras/navy', labelKey: 'calculadoras.hub.navy', descriptionKey: 'calculadoras.hub.navyDesc', icon: Target },
] as const

export interface CalculatorCatalogItem {
  to: string
  label: string
  description: string
  icon: LucideIcon
}

// Recientes: se persisten en localStorage (máx. 3) para recordar las últimas usadas.
const RECENTS_KEY = 'gymlab.recentCalculators'
const MAX_RECENTS = 3

export const getRecents = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    const arr = raw ? (JSON.parse(raw) as string[]) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

// Inserta la ruta al frente y descarta duplicados/sobrantes (cabeza de lista).
export const pushRecent = (to: string) => {
  const next = [to, ...getRecents().filter((t) => t !== to)].slice(0, MAX_RECENTS)
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
  } catch {
    // noop
  }
}