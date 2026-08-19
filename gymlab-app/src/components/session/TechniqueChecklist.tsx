// Checklist de técnica: modal con puntos clave por ejercicio.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckSquare, Square, X } from 'lucide-react'
import { getTechniqueChecklist, type TechniqueChecklist as TCData } from '@/domain/techniqueData'

interface TechniqueChecklistProps {
  exerciseId: number
  exerciseName: string
  onClose: () => void
}

export const TechniqueChecklist = ({ exerciseId, exerciseName, onClose }: TechniqueChecklistProps) => {
  const { t } = useTranslation()
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const checklist: TCData | undefined = getTechniqueChecklist(exerciseId)

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!checklist) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-bg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.7rem] font-bold text-fg">{exerciseName}</p>
            <button onClick={onClose} className="text-muted"><X className="size-4" /></button>
          </div>
          <p className="text-[0.6rem] text-muted">{t('technique.noData')}</p>
        </div>
      </div>
    )
  }

  const allChecked = checklist.points.every((p) => checked.has(p.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-bg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[0.7rem] font-bold text-fg">{exerciseName}</p>
          <button onClick={onClose} className="text-muted"><X className="size-4" /></button>
        </div>
        <div className="flex flex-col gap-2">
          {checklist.points.map((point) => (
            <button
              key={point.id}
              onClick={() => toggle(point.id)}
              className="flex items-start gap-2 rounded-lg border border-border/30 bg-bg-elevated/30 p-2.5 text-left"
            >
              {checked.has(point.id) ? (
                <CheckSquare className="size-4 mt-0.5 text-accent shrink-0" />
              ) : (
                <Square className="size-4 mt-0.5 text-muted shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[0.6rem] font-semibold text-fg">{point.label}</p>
                <p className="text-[0.55rem] text-muted">{point.description}</p>
              </div>
            </button>
          ))}
        </div>
        {allChecked && (
          <p className="mt-3 text-center text-[0.6rem] font-bold text-accent">{t('technique.allChecked')}</p>
        )}
      </div>
    </div>
  )
}
