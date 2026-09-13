// Selector de destino para el alta desde catálogo sin sesión activa (F98.3/D7).
// Dos pasos: rutina → día. Al elegir el día el caller persiste el ítem y ofrece undo.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, X } from 'lucide-react'
import { useRoutineDays, useRoutines } from '@/hooks/useRoutines'

interface RoutineDestinationSheetProps {
  exerciseName: string
  onChooseDay: (dayId: number) => void
  onClose: () => void
}

export const RoutineDestinationSheet = ({
  exerciseName,
  onChooseDay,
  onClose,
}: RoutineDestinationSheetProps) => {
  const { t } = useTranslation()
  const { routines } = useRoutines()
  const [routineId, setRoutineId] = useState<number | null>(null)
  const { days } = useRoutineDays(routineId)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('rutinas.elegirDestino')}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-bg/80"
    >
      <div className="w-full max-w-md rounded-t-2xl border border-border bg-bg-elevated p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-fg">
              {t('rutinas.elegirDestino')}
            </p>
            <p className="truncate text-xs text-muted">
              {t('rutinas.destinoMensaje', { nombre: exerciseName })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('layout.confirm.close')}
            className="relative flex size-11 shrink-0 items-center justify-center rounded-lg text-muted after:absolute after:-inset-1 after:content-['']"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto">
          {routineId === null
            ? routines.map((routine) => (
                <button
                  key={routine.id}
                  type="button"
                  onClick={() => setRoutineId(routine.id)}
                  className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-border bg-bg px-3 text-left text-sm text-fg transition-colors hover:border-cta"
                >
                  <span className="truncate">{routine.title}</span>
                  <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                </button>
              ))
            : days.length === 0
              ? (
                  <p className="py-4 text-center text-sm text-muted">{t('rutinas.sinDias')}</p>
                )
              : days.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => onChooseDay(day.id)}
                    className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-border bg-bg px-3 text-left text-sm text-fg transition-colors hover:border-cta"
                  >
                    <span className="truncate">{day.name}</span>
                    <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                  </button>
                ))}
        </div>
      </div>
    </div>
  )
}
