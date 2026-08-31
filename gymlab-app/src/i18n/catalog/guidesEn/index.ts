export interface GuideSectionEn {
  title: string
  content: string
  bullets: string[]
}

export interface GuideEn {
  title: string
  summary: string
  keyPoints: string[]
  sections: GuideSectionEn[]
}

import { seedGuidesEn_nutricion } from './nutricion'
import { seedGuidesEn_dietas } from './dietas'
import { seedGuidesEn_suplementos } from './suplementos'
import { seedGuidesEn_entrenamiento } from './entrenamiento'
import { seedGuidesEn_recuperacion } from './recuperacion'
import { seedGuidesEn_mujer } from './mujer'
import { seedGuidesEn_leyenda } from './leyenda'

export const GUIDES_EN: Record<string, GuideEn> = {
  ...seedGuidesEn_nutricion,
  ...seedGuidesEn_dietas,
  ...seedGuidesEn_suplementos,
  ...seedGuidesEn_entrenamiento,
  ...seedGuidesEn_recuperacion,
  ...seedGuidesEn_mujer,
  ...seedGuidesEn_leyenda,
}
