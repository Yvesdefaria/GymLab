// Hook que calcula la racha actual de entrenamiento (días consecutivos) desde el dominio.
import { useLiveList } from './useLiveList'
import { workoutRepo } from '@/data/repositories'
import { calcStreak } from '@/domain/streak'
import { localDateOf } from '@/domain/dates'

// Obtiene las fechas de los workouts y delega en calcStreak el cálculo de la racha.
// `daysPerWeek` sale del plan activo: un plan de 2 días exige 2, no 3.
export const useStreak = (daysPerWeek?: number) => {
  const workouts = useLiveList(() => workoutRepo.getAll())
  const dates = workouts.map(localDateOf)
  return calcStreak(dates, daysPerWeek)
}
