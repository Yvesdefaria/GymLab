// Barrel del catálogo i18n: helpers localize* y overlay EN para datos de catálogo.
import type { AppLanguage } from '@/domain/onboarding'
import type { Equipment } from '@/domain/types'
import { localizeEquipment } from './en'

export * from './en'

// Une las etiquetas del equipamiento de un ejercicio («Barra, Banco»).
export const localizeEquipmentList = (equipment: readonly Equipment[], lang: AppLanguage): string =>
  equipment.map((e) => localizeEquipment(e, lang)).join(', ')
