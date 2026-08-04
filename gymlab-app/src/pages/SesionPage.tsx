import { useParams } from 'react-router-dom'
import { EntrenamientoPage } from './EntrenamientoPage'
import { WorkoutDetail } from '@/components/workout/WorkoutDetail'

export const SesionPage = () => {
  const { id } = useParams()
  const workoutId = Number(id)

  if (Number.isInteger(workoutId) && workoutId > 0) {
    return <WorkoutDetail workoutId={workoutId} />
  }

  return <EntrenamientoPage />
}
