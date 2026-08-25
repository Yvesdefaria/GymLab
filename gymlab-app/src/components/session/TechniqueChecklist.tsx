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
            <p className="text-sm font-bold text-fg">{exerciseName}</p>
            <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted"><X className="size-5" /></button>
          </div>
          <p className="text-xs text-muted">{t('technique.noData')}</p>
        </div>
      </div>
    )
  }

  const allChecked = checklist.points.every((p) => checked.has(p.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-bg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-fg">{exerciseName}</p>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted"><X className="size-5" /></button>
        </div>
        <div className="flex flex-col gap-2">
          {checklist.points.map((point) => (
            <button
              key={point.id}
              onClick={() => toggle(point.id)}
              className="flex min-h-[48px] items-start gap-3 rounded-xl border border-border/30 bg-bg-elevated/30 p-3 text-left"
            >
              {checked.has(point.id) ? (
                <CheckSquare className="size-5 mt-0.5 text-accent shrink-0" />
              ) : (
                <Square className="size-5 mt-0.5 text-muted shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-fg">{t(point.labelKey as any)}</p>
                <p className="mt-0.5 text-xs text-muted">{t(point.descriptionKey as any)}</p>
              </div>
            </button>
          ))}
        </div>
        {allChecked && (
          <p className="mt-3 text-center text-sm font-bold text-accent">{t('technique.allChecked')}</p>
        )}
      </div>
    </div>
  )
}
