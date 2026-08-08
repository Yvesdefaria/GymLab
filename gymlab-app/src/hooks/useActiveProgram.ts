// Hook que expone el programa de entrenamiento activo y su rutina asociada.
import { useLiveQuery } from 'dexie-react-hooks'
import { activeProgramRepo, routineRepo } from '@/data/repositories'

// Lee el programa activo (persistido) y resuelve la rutina correspondiente para mostrar el plan actual.
export const useActiveProgram = () => {
  const program = useLiveQuery(() => activeProgramRepo.get(), [])
  const routine = useLiveQuery(
    () =>
      program
        ? routineRepo.getAll().then((rs) => rs.find((r) => r.id === program.routineId))
        : undefined,
    [program]
  )
  return { program, routine }
}
