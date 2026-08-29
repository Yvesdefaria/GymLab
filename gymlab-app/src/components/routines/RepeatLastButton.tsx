// Botón "Repetir última sesión" del detalle de rutina: carga el último workout del día, reconstruye
// la sesión con los mismos pesos/reps (domain `buildRepeatItems`) y lanza la sesión activa.
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Repeat } from 'lucide-react'
import { exerciseRepo } from '@/data/repositories'
import { useLastWorkout } from '@/hooks/useLastWorkout'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { buildRepeatItems } from '@/domain/workoutRepeat'

interface RepeatLastButtonProps {
  routineId: number
  dayId: number | null
  disabled?: boolean
}

export const RepeatLastButton = ({ routineId, dayId, disabled }: RepeatLastButtonProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const loadRoutineDay = useActiveWorkoutStore((s) => s.loadRoutineDay)
  const { lastWorkout, lastSets } = useLastWorkout(dayId)

  if (!lastWorkout || lastSets.length === 0 || dayId === null) return null

  // Repite la última sesión exacta (mismos pesos/reps) para el día seleccionado.
  const handleRepeat = async () => {
    // Obtener nombres de ejercicios del catálogo.
    const exerciseIds = [...new Set(lastSets.map((s) => s.exerciseId))]
    const exercises = await Promise.all(exerciseIds.map((id) => exerciseRepo.getById(id)))
    const nameMap = new Map(exercises.filter(Boolean).map((e) => [e!.id, e!.name]))
    const items = buildRepeatItems(lastSets, (id) => nameMap.get(id))
    loadRoutineDay(items, routineId, dayId)
    navigate('/entrenamiento/active')
  }

  return (
    <button
      type="button"
      onClick={() => void handleRepeat()}
      disabled={disabled}
      className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 text-xs font-medium text-accent-soft transition-colors hover:bg-accent/20 disabled:opacity-50"
    >
      <Repeat className="size-4" />
      {t('rutinas.detalle.repetirUltima')}
    </button>
  )
}