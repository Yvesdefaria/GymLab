// Hook que calcula la racha actual de entrenamiento (días consecutivos) desde el dominio.
import { useLiveQuery } from 'dexie-react-hooks'
import { workoutRepo } from '@/data/repositories'
import { calcStreak } from '@/domain/streak'
import { toLocalDateStr } from '@/domain/dates'

// Obtiene las fechas de los workouts y delega en calcStreak el cálculo de la racha.
export const useStreak = () => {
  const workouts = useLiveQuery(() => workoutRepo.getAll(), []) ?? []
  const dates = workouts.map((w) => w.localDate || toLocalDateStr(new Date(w.startedAt)))
  return calcStreak(dates)
}
