// Ruta /entrenamiento/:id: sirve como puente entre el detalle de un entreno guardado
// (con id numérico) y la sesión activa (sin id o no numérico).
import { useParams } from 'react-router-dom'
import { EntrenamientoPage } from './EntrenamientoPage'
import { WorkoutDetail } from '@/components/workout/WorkoutDetail'

export const SesionPage = () => {
  const { id } = useParams()
  const workoutId = Number(id)

  // Con id válido se muestra el detalle histórico; si no, la sesión de entrenamiento activa.
  if (Number.isInteger(workoutId) && workoutId > 0) {
    return <WorkoutDetail workoutId={workoutId} />
  }

  return <EntrenamientoPage />
}
