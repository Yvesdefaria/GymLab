import { useState } from 'react'
import { ImportDataView } from './ImportDataView'
import { workoutRepo, workoutSetRepo } from '@/data/repositories'
import { useTranslation } from 'react-i18next'
import { type ParsedImport } from '@/domain/importParsers'

export const ImportDataRoute = () => {
  const { t } = useTranslation()
  const [done, setDone] = useState(false)

  const handleImport = async (data: ParsedImport) => {
    for (const workout of data.workouts) {
      await workoutRepo.create(workout)
    }
    for (const set of data.sets) {
      await workoutSetRepo.create(set)
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 pb-20 pt-2">
        <p className="text-sm text-muted">{t('import.done')}</p>
      </div>
    )
  }

  return <ImportDataView onImport={handleImport} />
}
