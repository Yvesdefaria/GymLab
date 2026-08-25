// Checklist de técnica: panel de referencia con puntos clave por ejercicio.
import { useTranslation } from 'react-i18next'
import { X, AlertCircle } from 'lucide-react'
import { getTechniqueChecklist, type TechniqueChecklist as TCData } from '@/domain/techniqueData'

interface TechniqueChecklistProps {
  exerciseSlug: string
  exerciseName: string
  onClose: () => void
}

export const TechniqueChecklist = ({ exerciseSlug, exerciseName, onClose }: TechniqueChecklistProps) => {
  const { t } = useTranslation()
  const checklist: TCData | undefined = getTechniqueChecklist(exerciseSlug)

  if (!checklist) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-bg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-fg">{exerciseName}</p>
            <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted"><X className="size-5" /></button>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-bg-elevated/50 p-3">
            <AlertCircle className="size-4 text-muted shrink-0" />
            <p className="text-xs text-muted">{t('technique.noData')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-bg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-fg">{exerciseName}</p>
          <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted"><X className="size-5" /></button>
        </div>
        <div className="flex flex-col gap-2">
          {checklist.points.map((point, i) => (
            <div
              key={point.id}
              className="flex items-start gap-3 rounded-xl border border-border/30 bg-bg-elevated/30 p-3"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-fg">{t(point.labelKey as any)}</p>
                <p className="mt-0.5 text-xs text-muted">{t(point.descriptionKey as any)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
