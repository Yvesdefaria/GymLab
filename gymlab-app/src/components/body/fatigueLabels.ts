// Claves i18n de los niveles de fatiga. Vive en la capa de UI (no en domain)
// para que el dominio siga siendo TypeScript puro y sin dependencias de i18n.
import type { I18nKey } from '@/i18n'
import type { FatigueLevel } from '@/domain/types'

export const FATIGUE_LABEL_KEYS: Record<FatigueLevel | 'noData', I18nKey> = {
  fresh: 'cuerpo.fatiga.fresh',
  warm: 'cuerpo.fatiga.warm',
  fatigued: 'cuerpo.fatiga.fatigued',
  sore: 'cuerpo.fatiga.sore',
  noData: 'cuerpo.fatiga.noData',
}
