// Registro de pasos de hoy en vivo (F84e): consulta indexada por localDate
// (stepRepo.getByDate → donde('localDate')) en vez de barrer getAll() en
// memoria. Recovery y nutrición solo necesitan el día actual para el factor de
// actividad / ajuste calórico; el historial completo lo lee /logros nada más.
import { useLiveQuery } from 'dexie-react-hooks'
import { stepRepo } from '@/data/repositories'
import { toLocalDateStr } from '@/domain/dates'
import type { DailyStepsEntry } from '@/domain/types'

export const useTodayStepEntry = (): DailyStepsEntry | undefined =>
  useLiveQuery(() => stepRepo.getByDate(toLocalDateStr()), [])