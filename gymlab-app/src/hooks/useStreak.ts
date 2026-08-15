// Hook que calcula la racha actual de entrenamiento (días consecutivos) desde el dominio.
import { useLiveList } from './useLiveList'
import { workoutRepo } from '@/data/repositories'
import { calcStreak } from '@/domain/streak'
import { localDateOf } from '@/domain/dates'

// Obtiene las fechas de los workouts y delega en calcStreak el cálculo de la racha.
export const useStreak = () => {
  const workouts = useLiveList(() => workoutRepo.getAll())
  const dates = workouts.map(localDateOf)
  return calcStreak(dates)
}
