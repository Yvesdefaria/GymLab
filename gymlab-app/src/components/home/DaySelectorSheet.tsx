// Selector monocapa de día para iniciar sesión desde el hero del home (F99.1/D1):
// mismo shell, rows y patrón a11y que RoutineDestinationSheet, sin paso de rutina.
import { useTranslation } from 'react-i18next'
import { ChevronRight, X } from 'lucide-react'
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape'
import type { RoutineDay } from '@/domain/types'

interface DaySelectorSheetProps {
  days: RoutineDay[]
  routineName: string
  onSelectDay: (dayId: number) => void
  onClose: () => void
}

export const DaySelectorSheet = ({
  days,
  routineName,
  onSelectDay,
  onClose,
}: DaySelectorSheetProps) => {
  const { t } = useTranslation()
  // Cierra con Escape como alternativa a backdrop/X; sin efectos colaterales (D1).
  useCloseOnEscape(onClose)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('home.elegirDia')}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-bg/80"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-border bg-bg-elevated p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-fg">{t('home.elegirDia')}</p>
            <p className="truncate text-xs text-muted">
              {t('home.elegirDiaMensaje')} · {routineName}
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
          {days.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">{t('rutinas.sinDias')}</p>
          ) : (
            days.map((day) => (
              <button
                key={day.id}
                type="button"
                onClick={() => onSelectDay(day.id)}
                className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-border bg-bg px-3 text-left text-sm text-fg transition-colors hover:border-cta"
              >
                <span className="truncate">{day.name}</span>
                <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}