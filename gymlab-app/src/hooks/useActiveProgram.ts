import { useLiveQuery } from 'dexie-react-hooks'
import { activeProgramRepo, routineRepo } from '@/data/repositories'

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
