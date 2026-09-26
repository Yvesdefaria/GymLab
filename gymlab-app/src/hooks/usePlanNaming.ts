// Nombres del plan en el idioma de la UI (R3-003): lo que se persiste queda localizado.
// Mapas estáticos de claves porque `t()` está tipado contra el esquema `es` y no se
// pueden construir dot-paths por template string.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlanNaming } from '@/domain/routineResolution'
import type { Objective } from '@/domain/types'
import type { I18nKey } from '@/i18n'

// Índice 0 sin uso: el día 1 es la posición 1 (paridad con `dayNumber`).
const DAY_KEYS: readonly (I18nKey | undefined)[] = [
  undefined,
  'planner.day1',
  'planner.day2',
  'planner.day3',
  'planner.day4',
  'planner.day5',
  'planner.day6',
]

const OBJECTIVE_KEYS: Record<Objective, I18nKey> = {
  volumen: 'planner.objectives.volumen',
  definicion: 'planner.objectives.definicion',
  fuerza: 'planner.objectives.fuerza',
  resistencia: 'planner.objectives.resistencia',
  general: 'planner.objectives.general',
}

export const usePlanNaming = (): PlanNaming => {
  const { t } = useTranslation()
  return useMemo(
    () => ({
      dayName: (dayNumber) => {
        const key = DAY_KEYS[dayNumber]
        return key ? t(key) : `Día ${dayNumber}`
      },
      title: (objective, days) => t('planner.planTitle', { objective: t(OBJECTIVE_KEYS[objective]), days }),
    }),
    [t],
  )
}
